#!/usr/bin/env node
/* eslint no-console:0 no-process-exit:0 */

var Client = require('../client/client');
var Parser = require('posix-getopt').BasicParser;
var _ = require('lodash');
var assert = require('assert');
var async = require('async');
var concat = require('concat-stream');
var debug = require('debug')('strong-mesh-models:meshctl');
var fmt = require('util').format;
var fs = require('fs');
var glb = require('strong-globalize');
var npmls = require('strong-npm-ls');
var path = require('path');
var table = require('text-table');
var userHome = require('user-home');
var maybeTunnel = require('strong-tunnel');

assert(userHome, 'User home directory cannot be determined!');

function printHelp($0, prn) {
  var USAGE = glb.t('sl-meshctl.txt')
    .replace(/%MAIN%/g, $0)
    .trim();

  prn(USAGE);
}

glb.setRootDir(path.resolve(__dirname, '..'));

var argv = process.argv;
var $0 = process.env.CMD || path.basename(argv[1]);
var parser = new Parser([
  ':v(version)',
  'h(help)',
  'C:(control)',
  'V(verbose)',
].join(''), argv);

var apiUrl = process.env.STRONGLOOP_MESH_API ||
  process.env.STRONGLOOP_PM ||
  'http://127.0.0.1:8701';

var command = 'status';
var verbose = false;
var option;
while ((option = parser.getopt()) !== undefined) {
  switch (option.option) {
    case 'v':
      glb.log(require('../package.json').version);
      process.exit(0);
      break;
    case 'h':
      printHelp($0, console.log);
      process.exit(0);
      break;
    case 'C':
      apiUrl = option.optarg;
      break;
    case 'V':
      verbose = true;
      break;
    default:
      glb.error('Invalid usage (near option \'%s\'), try `%s --help`.',
        option.optopt,
        $0);
      process.exit(1);
  }
}

var optind = parser.optind();

if (optind < argv.length) {
  command = argv[optind++];
}

debug('API Url: %s', apiUrl);

var sshOpts = {};

if (process.env.SSH_USER) {
  sshOpts.username = process.env.SSH_USER;
}

if (process.env.SSH_KEY) {
  sshOpts.privateKey = fs.readFileSync(process.env.SSH_KEY);
}

if (process.env.SSH_PORT) {
  sshOpts.port = process.env.SSH_PORT;
}

die.url = apiUrl;
maybeTunnel(apiUrl, sshOpts, function(err, apiUrl) {
  die.url = apiUrl || die.url;
  if (err) return die(err);
  var client = new Client(apiUrl);

  client.checkRemoteApiSemver(function(err) {
    if (err) return die(err);
    runCommand(client, command);
  });
});

function runCommand(client, command) {
  ({
    create: cmdCreateService,
    remove: cmdRemoveService,
    ls: cmdListServices,
    status: cmdStatus,
    info: cmdInfo,
    start: cmdStart,
    stop: cmdStop,
    'soft-stop': cmdSoftStop,
    restart: cmdRestart,
    'soft-restart': cmdSoftRestart,
    'cluster-restart': cmdRollingRestart,
    'set-size': cmdSetClusterSize,
    'objects-start': cmdObjectTrackingStart,
    'objects-stop': cmdObjectTrackingStop,
    'cpu-start': cmdCpuProfilingStart,
    'cpu-stop': cmdCpuProfilingStop,
    'heap-snapshot': cmdHeapSnapshot,
    'tracing-start': cmdTracingStart,
    'tracing-stop': cmdTracingStop,
    npmls: cmdLs,
    patch: cmdPatch,
    'env-set': cmdEnvSet,
    'env-unset': cmdEnvUnset,
    'env-get': cmdEnvGet,
    env: cmdEnvGet,
    'get-process-count': cmdGetProcessCount, // No docs, internal use only.
    'log-dump': cmdLogDump,
    shutdown: cmdShutdown,
    'dbg-start': cmdDebuggerStart,
    'dbg-stop': cmdDebuggerStop,
  }[command] || unknown)(client);
}

function unknown() {
  glb.error('Unknown command: %s, try `%s --help`.', command, $0);
  process.exit(1);
}

function cmdStatus(client) {
  var targetService = optional();

  if (targetService) {
    client.serviceFind(targetService, function(err, service) {
      if (err) return die(err);
      printServiceStatus(service);
    });
  } else {
    client.serviceList(function(err, services) {
      if (err) return die(err);
      if (!services.length) {
        console.log('No services exist');
        return;
      }
      async.eachSeries(services, function(svc, next) {
        printServiceStatus(svc, next);
      });
    });
  }
}

function cmdInfo(client) {
  client.apiInfo(function(err, info) {
    if (err) return die(err);

    debug('api info: %j', info);

    var infoTable = [];

    info.serverName = info.serverName || 'strong-pm';

    I('Server Name:', 'serverName');
    I('Server Version:', 'version');
    I('Server PID:', 'serverPid');
    I('API Version:', 'apiVersion');
    I('API Port:', 'apiPort');
    O('Driver Type:', 'driverType');
    O('Driver Status:', 'driverStatus');

    glb.log('%s', table(infoTable));

    function I(title, f) {
      var s = info[f];
      assert(s != null, fmt('%s must exist', f));
      infoTable.push([title, String(s)]);
    }

    function O(title, f) {
      if (info[f] == null) return;
      I(title, f);
    }
  });
}

function printServiceEnv(env) {
  if (Object.keys(env).length > 0) {
    var envTable = [['  ', 'Name', 'Value']];
    for (var k in env) {
      if (!env.hasOwnProperty(k)) continue;
      envTable.push(['', k, env[k]]);
    }
    glb.log('%s', table(envTable));
  } else {
    glb.log('  No environment variables defined');
  }
}

function printServiceStatus(service, callback) {
  service.getStatusSummary(function(err, summary) {
    if (err) return die(err);

    glb.log('Service ID: %s', summary.id);
    glb.log('Service Name: %s', summary.name);

    glb.log('Environment variables:');
    printServiceEnv(summary.env);

    var instanceTable = [[
      '  ', 'Version', 'Agent version', 'Debugger version',
      'Cluster size', 'Driver metadata',
    ]];
    for (var i in summary.instances) {
      if (!summary.instances.hasOwnProperty(i)) continue;
      var inst = summary.instances[i];
      assert('version' in inst);
      assert('agentVersion' in inst);
      assert('clusterSize' in inst);
      var meta = inst.driverMeta && inst.driverMeta.user
                ? JSON.stringify(inst.driverMeta.user)
                : 'N/A';
      instanceTable.push(['',
        inst.version, inst.agentVersion, inst.debuggerVersion,
        inst.clusterSize, meta,
      ]);
    }
    glb.log('Instances:\n%s', table(instanceTable, {
      align: ['c', 'c', 'c', 'c', 'c', 'c'],
    }));

    var processTable = [
      ['  ', 'ID', 'PID', 'WID', 'Listening Ports',
          'Tracking objects?', 'CPU profiling?', 'Tracing?', 'Debugging?'],
    ];
    if (verbose)
      processTable[0].push('Stop reason', 'Stop time');

    for (i in summary.processes) {
      if (!summary.processes.hasOwnProperty(i)) continue;
      if (!verbose && summary.processes[i].stopReason) continue;

      var proc = summary.processes[i];
      var procEntry = [
        '',
        proc.displayId,
        proc.pid,
        proc.workerId,
        proc.listeningSockets.map(addr2str).join(', '),
        proc.isTrackingObjects ? 'yes' : '',
        profiling(proc),
        proc.isTracing ? 'yes' : '',
        proc.debugger && proc.debugger.running ? 'yes' : '',
      ];
      if (verbose)
        procEntry.push(proc.stopReason, proc.stopTime || '');
      processTable.push(procEntry);
    }

    function profiling(proc) {
      if (!proc.isProfiling) return '';
      if (!proc.watchdogTimeout) return 'yes';
      if (!proc.watchdogStallout) return proc.watchdogTimeout + 'ms';
      return proc.watchdogStallout + 'x' + proc.watchdogTimeout + 'ms';
    }

    if (processTable.length > 1) {
      glb.log('Processes:\n%s\n', table(processTable, {
        align: [
          'c', 'c', 'c', 'c', 'c', 'c', 'l', 'c',
        ],
      }));
    } else {
      glb.log('Not started');
    }

    if (callback) return callback();
  });
  function addr2str(address) {
    var str;
    if ('address' in address) {
      str = fmt('%s:%d', address.address || '0.0.0.0', address.port);
    } else {
      str = fmt('unix:%s', address);
    }
    return str;
  }
}

function printResponse(service, summmaryMsg, err, responses) {
  if (err) return die(err);

  debug('response service %j', service);
  debug('response summary %j', summmaryMsg);
  debug('response err %j', err);

  var hasError = false;
  var responseTable = [['  ', 'Instance', 'Response']];
  for (var i in responses) {
    if (!responses.hasOwnProperty(i)) continue;
    var r = responses[i];
    debug('responses[%d] instance %j', i, r.instance);
    debug('responses[%d] response %j', i, r.response);
    if (r.error) {
      hasError = true;
      responseTable.push(['', r.instance, r.error || '']);
    } else {
      var msg = r.response && r.response.message ? r.response.message : '';
      responseTable.push(['', r.instance, msg]);
    }
  }

  if (verbose || hasError) {
    glb.log('Service: %j', service.name);
    glb.log(table(responseTable, {align: ['c', 'c']}));
  } else if (summmaryMsg) {
    glb.log('Service %j %s', service.name, summmaryMsg);
  }

  if (hasError) die('error');
}

function cmdCreateService(client) {
  var name = mandatory('name');
  var scale = optional(1);

  client.serviceCreate(name, scale, function(err, result) {
    debug('service-create: %j', err || result);
    if (err) return die(err);
    var g = result._groups[0];
    glb.log('Created Service id: %s name: %j group: %j scale: %d',
      result.id, result.name, g.name, g.scale);
  });
}

function cmdListServices(client) {
  client.serviceList(function(err, result) {
    debug('service-list: %j', err || result);
    if (err) return die(err);

    if (result.length) {
      var data = [];
      data.push(['Id', 'Name', 'Scale']);
      for (var i in result) {
        if (!result.hasOwnProperty(i)) continue;
        var s = result[i];
        var scale = 0;
        for (var g in s._groups) {
          if (!s._groups.hasOwnProperty(g)) continue;
          scale += s._groups[g].scale;
        }

        data.push([s.id, s.name, scale]);
      }
      glb.log(table(data, {align: ['c', 'c', 'c']}));
    } else {
      glb.log('No services defined');
    }
  });
}

function cmdRemoveService(client) {
  var name = mandatory('name');

  client.serviceDestroy(name, function(err, result) {
    debug('service-destroy: %j', err || result);
    if (err) return die(err);
    glb.log('Destroyed service: %s', name);
  });
}

function cmdStart(client) {
  var targetService = mandatory('service');
  client.serviceFind(targetService, function(err, service) {
    if (err) return die(err);
    service.start(printResponse.bind(null, service, glb.t('starting...')));
  });
}

function cmdStop(client) {
  var targetService = mandatory('service');
  client.serviceFind(targetService, function(err, service) {
    if (err) return die(err);
    service.stop({}, printResponse.bind(null, service, glb.t('hard stopped')));
  });
}

function cmdSoftStop(client) {
  var targetService = mandatory('service');
  client.serviceFind(targetService, function(err, service) {
    if (err) return die(err);
    service.stop(
      {soft: true},
      printResponse.bind(null, service, glb.t('soft stopped'))
    );
  });
}

function cmdRestart(client) {
  var targetService = mandatory('service');
  client.serviceFind(targetService, function(err, service) {
    if (err) return die(err);
    service.restart({}, printResponse.bind(null, service, glb.t('restarting')));
  });
}

function cmdSoftRestart(client) {
  var targetService = mandatory('service');
  client.serviceFind(targetService, function(err, service) {
    if (err) return die(err);
    service.restart(
      {soft: true},
      printResponse.bind(null, service, glb.t('soft restarting'))
    );
  });
}

function cmdRollingRestart(client) {
  var targetService = mandatory('service');
  client.serviceFind(targetService, function(err, service) {
    if (err) return die(err);
    service.restart({rolling: true}, printResponse.bind(null, service, null));
  });
}

function cmdSetClusterSize(client) {
  var targetService = mandatory('service');
  var size = mandatory('size');
  var persist = true;

  client.serviceFind(targetService, function(err, service) {
    if (err) return die(err);
    service.setClusterSize(
      size,
      persist,
      printResponse.bind(null, service, glb.t('size was set to %d', size))
    );
  });
}

function cmdObjectTrackingStart(client) {
  var target = mandatory('target');

  client.resolveTarget(target,
    function(err, service, executor, instance, process) {
      if (err) return die(err);
      instance.startObjectTracking(process.id, dieIf);
    }
  );
}

function cmdObjectTrackingStop(client) {
  var target = mandatory('target');

  client.resolveTarget(target,
    function(err, service, executor, instance, process) {
      if (err) return die(err);
      instance.stopObjectTracking(process.id, dieIf);
    }
  );
}

function cmdCpuProfilingStart(client) {
  var target = mandatory('target');
  var timeout = optional(0);
  var stallout = optional(0);

  client.resolveTarget(target,
    function(err, service, executor, instance, process) {
      if (err) return die(err);
      var cmd = {
        watchdogTimeout: timeout,
        watchdogStallout: stallout,
      };
      instance.startCpuProfiling(process.id, cmd, function(err, response) {
        if (err) return die(err);
        debug('startCpuProfiling: %j', response);
        glb.log('Profiler started, use cpu-stop to get profile');
      });
    }
  );
}

function cmdCpuProfilingStop(client) {
  var target = mandatory('target');
  var prefix = optional(fmt('node.%s', target));
  var fileName = prefix + '.cpuprofile';

  client.resolveTarget(target,
    function(err, service, executor, instance, process) {
      if (err) return die(err);
      instance.stopCpuProfiling(process.id, function(err, response) {
        if (err) return die(err);
        var profileId = response.profileId;
        download(instance, profileId, fileName, function(err) {
          if (err) return die(err);
          glb.log('CPU profile written to `%s`, load into Chrome Dev Tools',
            fileName);
        });
      });
    }
  );
}

function cmdTracingStart(client) {
  var target = mandatory('target');
  client.resolveInstance(target,
    function(err, service, executor, instance) {
      if (err) return die(err);
      instance.tracingStart(function(err) {
        if (err) return die(err);
        glb.log('Tracing started');
      });
    }
  );
}

function cmdTracingStop(client) {
  var target = mandatory('target');
  client.resolveInstance(target,
    function(err, service, executor, instance) {
      if (err) return die(err);
      instance.tracingStop(function(err) {
        if (err) return die(err);
        glb.log('Tracing stopped');
      });
    }
  );
}

function cmdHeapSnapshot(client) {
  var target = mandatory('target');
  var prefix = optional(fmt('node.%s', target));
  var fileName = prefix + '.heapsnapshot';

  client.resolveTarget(target,
    function(err, service, executor, instance, process) {
      if (err) return die(err);
      instance.heapSnapshot(process.id, function(err, response) {
        if (err) return die(err);
        var profileId = response.profileId;
        download(instance, profileId, fileName, function(err) {
          if (err) return die(err);
          glb.log(
            'Heap snapshot written to `%s`, load into Chrome Dev Tools',
            fileName
          );
        });
      });
    }
  );
}

function cmdLs(client) {
  var targetService = mandatory('service');
  var depth = optional(Number.MAX_VALUE);

  client.serviceFind(targetService,
    function(err, service) {
      if (err) return die(err);
      service.instances({limit: 1}, function(err, instances) {
        if (err) return die(err);
        if (instances.length !== 1) return die(Error('Invalid service'));
        var instance = instances[0];
        instance.npmModuleList(function(err, response) {
          if (err) return die(err);
          glb.log(npmls.printable(response, depth));
        });
      });
    });
}

function cmdPatch(client) {
  var target = mandatory('target');
  var patchFile = mandatory('patch file');

  var patchData = JSON.parse(fs.readFileSync(patchFile));
  client.resolveTarget(target,
    function(err, service, executor, instance, process) {
      if (err) return die(err);
      instance.applyPatch(process.id, patchData, function(err/* , response*/) {
        if (err) return die(err);
      });
    }
  );
}

function cmdEnvSet(client) {
  var targetService = mandatory('service');
  var vars = mandatorySome('K=V');
  var env = _.reduce(vars, extractKeyValue, {});

  client.serviceFind(targetService, function(err, service) {
    if (err) return die(err);
    service.setEnvs(env, function(err, responses) {
      if (err) return die(err);

      // XXX: Update when server supports rollback if instance update fails.
      printResponse(service, glb.t('environment updated'), err, responses);
      service.refresh(function(err, service) {
        if (err) return die(err);
        printServiceEnv(service.env);
      });
    });
  });

  function extractKeyValue(store, pair) {
    var kv = pair.split('=');
    if (!kv[0] || !kv[1]) {
      glb.error('Invalid usage (not K=V format: `%s`), try `%s --help`.',
        pair, $0);
      process.exit(1);
    }
    store[kv[0]] = kv.slice(1).join('=');
    return store;
  }
}

function cmdEnvUnset(client) {
  var targetService = mandatory('service');
  var keys = mandatorySome('KEYS');
  var nulls = _.map(keys, _.constant(null));
  var nulledKeys = _.zipObject(keys, nulls);

  client.serviceFind(targetService, function(err, service) {
    if (err) return die(err);
    service.setEnvs(nulledKeys, function(err, responses) {
      if (err) return die(err);

      // XXX: Update when server supports rollback if instance update fails.
      printResponse(service, glb.t('environment updated'), err, responses);
      service.refresh(function(err, service) {
        if (err) return die(err);
        printServiceEnv(service.env);
      });
    });
  });
}

function cmdEnvGet(client) {
  var targetService = mandatory('service');
  var keys = optionalSome();

  client.serviceFind(targetService, function(err, service) {
    if (err) return die(err);
    glb.log('Service ID: %s', service.id);
    glb.log('Service Name: %s\n', service.name);
    var filtered = keys.length > 0 ? _.pick(service.env, keys) : service.env;
    glb.log('Environment variables:');
    if (_.keys(filtered).length === 0) {
      glb.log('  No matching environment variables defined');
    } else {
      printServiceEnv(filtered);
    }
  });
}

function cmdGetProcessCount(client) {
  var targetService = mandatory();
  client.serviceFind(targetService, function(err, service) {
    if (err) return die(err);
    service.getStatusSummary(function(err, summary) {
      if (err) return die(err);
      var processes = 0;
      for (var i in summary.processes) {
        if (!summary.processes.hasOwnProperty(i)) continue;
        if (summary.processes[i].stopReason) continue;
        processes++;
      }
      glb.log('Service ID %j processes: %d', service.id, processes);
    });
  });
}

function cmdLogDump(client) {
  var targetService = mandatory('service');
  var repeat = (optional('NOFOLLOW') === '--follow');

  client.serviceFind(targetService, function(err, service) {
    if (err) return die(err);
    return logDump();

    function logDump() {
      service.logDump(function(err, responses) {
        if (err) return die(err);

        for (var i in responses) {
          if (!responses.hasOwnProperty(i)) continue;
          if (responses[i].error) return die(responses[i].error);

          var rsp = responses[i].response;
          if (rsp.message) {
            console.error(rsp.message);
          } else {
            process.stdout.write(rsp.log);
          }
        }

        if (repeat) {
          setTimeout(logDump, 1000);
        }
        return repeat;
      });
    }
  });
}

function cmdShutdown(client) {
  client.getApi().shutdown(function(err, res) {
    if (err) return die(err);
    console.log('%s', res.message);
  });
}

function download(instance, profileId, file, callback) {
  instance.downloadProfile(profileId, function(err, res) {
    if (err) return callback(err);

    debug('http.get: %d', res.statusCode);
    var out;

    switch (res.statusCode) {
      case 200: {
        out = fs.createWriteStream(file);
        res.once('error', callback);
        out.once('error', callback);
        out.once('finish', callback);
        res.pipe(out);
        break;
      }
      case 204: {
        // No content, keep polling until completed or errored
        setTimeout(function() {
          download(instance, profileId, file, callback);
        }, 200);
        break;
      }
      default: {
        // Collect response stream to use as error message.
        out = concat(function(data) {
          callback(glb.Error('code %d/%s',
            res.statusCode, data));
        });
        res.once('error', callback);
        out.once('error', callback);
        res.pipe(out);
      }
    }
  });
}

function cmdDebuggerStart(client) {
  var target = mandatory('target');

  client.resolveTarget(target,
    function(err, service, executor, instance, process) {
      if (err) return die(err);
      instance.startDebugger(process.id, function(err, response) {
        if (err) return die(err);
        debug('startDebugger: %j', response);
        glb.log('Debugger listening on port %s.', response.port);
      });
    }
  );
}

function cmdDebuggerStop(client) {
  var target = mandatory('target');

  client.resolveTarget(target,
    function(err, service, executor, instance, process) {
      if (err) return die(err);
      instance.stopDebugger(process.id, function(err, response) {
        if (err) return die(err);
        debug('stopDebugger: %j', response);
        glb.log('Debugger was disabled.');
      });
    }
  );
}

function mandatory(name) {
  if (optind >= argv.length) {
    glb.error('Missing %s argument for %s, try `%s --help`.',
      name, command, $0);
    process.exit(1);
  }

  return argv[optind++];
}

function mandatorySome(name) {
  if (optind >= argv.length) {
    glb.error('Missing %s argument for %s, try `%s --help`.',
      name, command, $0);
    process.exit(1);
  }
  return argv.slice(optind);
}

function optional(def) {
  if (optind >= argv.length) {
    return def;
  }

  return argv[optind++];
}

function optionalSome() {
  if (optind < argv.length) {
    return argv.slice(optind);
  }
  return [];
}

function dieIf(err) {
  if (err) {
    die(err);
  }
}

function die(err) {
  var msg = String(err);

  // loopback error messages are very long and verbose... like:
  //   ValidationError: The `Account` instance is not valid. Details: `username`
  //   User already exists (value: 'admin'); `email` Email already exists
  //   (value: 'ignore@me.com').
  // Split into first line, and the rest.
  var msgs = msg.split('. ');

  glb.error('Command %j on %j failed with %s',
                command, die.url, msgs.shift());
  if (msgs.length) {
    glb.error('%s', msgs.join('. ').trim());
  }
  process.on('exit', function(code) {
    process.exit(code || 1);
  });
}
