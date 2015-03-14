#!/usr/bin/env node
/* eslint no-console:0 no-process-exit:0 */

var Client = require('../client/client');
var Parser = require('posix-getopt').BasicParser;
var _ = require('lodash');
var assert = require('assert');
var concat = require('concat-stream');
var debug = require('debug')('strong-mesh-client:meshctl');
var fs = require('fs');
var home = require('osenv').home();
var npmls = require('strong-npm-ls');
var path = require('path');
var sprintf = require('sprintf');
var userHome = require('user-home');
var util = require('util');
var maybeTunnel = require('strong-tunnel');

assert(userHome, 'User home directory cannot be determined!');

function printHelp($0, prn) {
  var USAGE = fs.readFileSync(require.resolve('./sl-meshctl.txt'), 'utf-8')
    .replace(/%MAIN%/g, $0)
    .trim();

  prn(USAGE);
}

var argv = process.argv;
var $0 = process.env.CMD || path.basename(argv[1]);
var parser = new Parser([
  ':v(version)',
  'h(help)',
  'C:(control)'
].join(''), argv);

var apiUrl = process.env.STRONGLOOP_MESH_API ||
  process.env.STRONGLOOP_PM ||
  exists('pmctl') ||
  exists(path.join(home, '.strong-pm', 'pmctl')) ||
  exists('/var/lib/strong-pm/pmctl') ||
  'http://127.0.0.1:8701';

var command = 'status';
var option;
while ((option = parser.getopt()) !== undefined) {
  switch (option.option) {
    case 'v':
      console.log(require('../package.json').version);
      process.exit(0);
      break;
    case 'h':
      printHelp($0, console.log);
      process.exit(0);
      break;
    case 'C':
      apiUrl = option.optarg;
      break;
    default:
      console.error('Invalid usage (near option \'%s\'), try `%s --help`.',
        option.optopt,
        $0);
      process.exit(1);
      break;
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

maybeTunnel(apiUrl, sshOpts, function(err, apiUrl) {
  dieIf(err);
  runCommand(apiUrl, command);
});

function runCommand(apiUrl, command) {
  var client = new Client(apiUrl);
  var instanceId = process.env.STRONG_MESH_INSTANCE_ID || '1';
  client.instanceFind(instanceId, function(err, instance) {
    dieIf(err);
    ({
      'status': cmdStatus,
      'start': cmdStart,
      'stop': cmdStop,
      'soft-stop': cmdSoftStop,
      'restart': cmdRestart,
      'soft-restart': cmdSoftRestart,
      'cluster-restart': cmdRollingRestart,
      'set-size': cmdSetClusterSize,
      'objects-start': cmdObjectTrackingStart,
      'objects-stop': cmdObjectTrackingStop,
      'cpu-start': cmdCpuProfilingStart,
      'cpu-stop': cmdCpuProfilingStop,
      'heap-snapshot': cmdHeapSnapshot,
      'ls': cmdLs,
      'env-set': cmdEnvSet,
      'env-unset': cmdEnvUnset,
      'env-get': cmdEnvGet,
      'log-dump': cmdLogDump,
      'shutdown': cmdShutdown,
    }[command] || unknown)(instance);
  });
}

function unknown() {
  console.error('Unknown command: %s, try `%s --help`.', command, $0);
  process.exit(1);
}

function cmdStatus(instance) {
  instance.statusSummary(function fmtSummary(err, rsp) {
    dieIf(err);

    function fmt(depth, tag /*...*/) {
      var value = util.format.apply(util, [].slice.call(arguments, 2));
      var width = 22 - 2 * depth;
      var line;
      if (value.length > 0)
        line = sprintf(w(depth) + '%-' + width + 's%s', tag + ':', value);
      else
        line = w(depth) + tag + ':';
      console.log(line);
      function w(depth) {
        return sprintf('%' + (2 * depth) + 's', '');
      }
    }
    fmt(0, 'manager');
    fmt(1, 'pid', '%s', rsp.pid);
    fmt(1, 'port', '%s', rsp.port);
    fmt(1, 'base', '%s', rsp.base);

    var current = rsp.current;

    if (!rsp.current) {
      fmt(0, 'current', '(none)');
      return;
    }

    var workers = current.workers;
    var config = current.config;
    var files = config.files;

    fmt(0, 'current');
    fmt(1, 'status', current.pid ? 'started' : 'stopped');
    if (current.pid)
      fmt(1, 'pid', '%s', current.pid);

    fmt(1, 'link', '%s', current.pwd);
    fmt(1, 'current', '%s',
      path.relative(path.resolve(current.pwd, '..'), current.cwd));
    if (current.branch) {
      fmt(1, 'branch', '%s', current.branch);
    }

    fmt(1, 'worker count', '%d', workers ? workers.length : 0);
    if (workers) {
      for (var i = 0; i < workers.length; i++) {
        var worker = workers[i];
        var id = worker.id;
        var pid = worker.pid;
        fmt(2, util.format('[%d]', i + 1), 'cluster id %s, pid %d', id, pid);
      }
    }
    if (files && Object.keys(files).length > 0) {
      fmt(2, 'files');
      Object.keys(files).sort().forEach(function(dst) {
        var src = files[dst];
        var srcFull = path.resolve(config.base, src);
        fmt(3, dst, '(from) %s', srcFull);
      });
    }
  });
}

function cmdStart(instance) {
  instance.appStart(function(err, response) {
    dieIf(err);
    console.log(response.message);
  });
}

function cmdStop(instance) {
  instance.appStop({}, function(err, response) {
    dieIf(err);
    console.log(response.message);
  });
}

function cmdSoftStop(instance) {
  instance.appStop({soft: true}, function(err, response) {
    dieIf(err);
    console.log(response.message);
  });
}

function cmdRestart(instance) {
  instance.appRestart({}, function(err, response) {
    dieIf(err);
    console.log(response.message);
  });
}

function cmdSoftRestart(instance) {
  instance.appRestart({soft: true}, function(err, response) {
    dieIf(err);
    console.log(response.message);
  });
}

function cmdRollingRestart(instance) {
  instance.appRestart({rolling: true}, function(err /*, response*/) {
    dieIf(err);
  });
}

function cmdSetClusterSize(instance) {
  var size = mandatory('size');

  instance.clusterSizeSet(size, false, function(err /*, response*/) {
    dieIf(err);
  });
}

function cmdObjectTrackingStart(instance) {
  var target = mandatory('target');

  instance.objectTrackingStart(target, function(err /*, response*/) {
    dieIf(err);
  });
}

function cmdObjectTrackingStop(instance) {
  var target = mandatory('target');

  instance.objectTrackingStop(target, function(err  /*, response*/) {
    dieIf(err);
  });
}

function cmdCpuProfilingStart(instance) {
  var target = mandatory('target');
  var timeout = optional(0);

  instance.cpuProfilingStart(target, {watchdogTimeout: timeout},
    function(err /*, response*/) {
      dieIf(err);
      console.log('Profiler started, use cpu-stop to get profile');
    }
  );
}

function cmdCpuProfilingStop(instance) {
  var target = mandatory('target');
  var prefix = optional(util.format('node.%s', target));
  var fileName = prefix + '.cpuprofile';

  instance.cpuProfilingStop(target, function(err, response) {
    dieIf(err);
    var profileId = response.profileId;
    download(instance, profileId, fileName, function(err) {
      dieIf(err);
      console.log('CPU profile written to `%s`, load into Chrome Dev Tools',
        fileName);
    });
  });
}

function cmdHeapSnapshot(instance) {
  var target = mandatory('target');
  var prefix = optional(util.format('node.%s', target));
  var fileName = prefix + '.heapsnapshot';

  instance.heapSnapshot(target, function(err, response) {
    dieIf(err);
    var profileId = response.profileId;
    download(instance, profileId, fileName, function(err) {
      dieIf(err);
      console.log('Heap snapshot written to `%s`, load into Chrome Dev Tools',
        fileName);
    });
  });
}

function cmdLs(instance) {
  var depth = optional(Number.MAX_VALUE);

  instance.npmModuleList(function(err, response) {
    dieIf(err);
    console.log(npmls.printable(response, depth));
  });
}

function cmdEnvSet(instance) {
  var vars = mandatorySome('K=V');
  var env = _.reduce(vars, extractKeyValue, {});
  instance.envSet(env, function(err, response) {
    dieIf(err);
    console.log('Environment updated: %j', response.message);
  });

  function extractKeyValue(store, pair) {
    var kv = pair.split('=');
    if (!kv[0] || !kv[1]) {
      console.error('Invalid usage (not K=V format: `%s`), try `%s --help`.',
        pair, $0);
      process.exit(1);
    }
    store[kv[0]] = kv[1];
    return store;
  }
}

function cmdEnvUnset(instance) {
  var keys = mandatorySome('KEYS');
  var nulls = _.map(keys, _.constant(null));
  var nulledKeys = _.zipObject(keys, nulls);

  instance.envSet(nulledKeys, function(err, response) {
    dieIf(err);
    console.log('Environment updated: %j', response.message);
  });
}

function cmdEnvGet(instance) {
  var vars = optionalSome();

  instance.envGet(function(err, response) {
    dieIf(err);
    var filtered = vars.length > 0 ? _.pick(response.env, vars) : response.env;
    console.log('Environment variables:');
    if (_.keys(filtered).length === 0) {
      console.log('  No matching environment variables defined');
    } else {
      _.keys(filtered).sort().forEach(function(k) {
        console.log(' %s=%s', k, filtered[k]);
      });
    }
  });
}

function cmdLogDump(instance) {
  var repeat = (optional('NOFOLLOW') === '--follow');

  return logDump();

  function logDump() {
    instance.logDump(function(err, rsp) {
      dieIf(err);

      if (rsp.message) {
        console.error(rsp.message);
      } else {
        process.stdout.write(rsp.log);
      }

      if (repeat) {
        setTimeout(logDump, 1000);
      }
      return repeat;
    });
  }
}

function cmdShutdown(instance) {
  instance.shutdown(function(err, response) {
    dieIf(err);
    console.log(response.message);
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
          callback(Error(util.format('code %d/%s',
            res.statusCode, data)));
        });
        res.once('error', callback);
        out.once('error', callback);
        res.pipe(out);
      }
    }
  });
}

function exists(path) {
  if (fs.existsSync(path))
    return path;
}

function mandatory(name) {
  if (optind >= argv.length) {
    console.error('Missing %s argument for %s, try `%s --help`.',
      name, command, $0);
    process.exit(1);
  }

  return argv[optind++];
}

function mandatorySome(name) {
  if (optind >= argv.length) {
    console.error('Missing %s argument for %s, try `%s --help`.',
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
  if (!err)
    return;

  var msg = String(err);

  // loopback error messages are very long and verbose... like:
  //   ValidationError: The `Account` instance is not valid. Details: `username`
  //   User already exists (value: 'admin'); `email` Email already exists
  //   (value: 'ignore@me.com').
  // Split into first line, and the rest.
  var msgs = msg.split('.');

  console.error('Command %s failed with %s', command, msgs.shift());
  if (msgs.length) {
    console.error('%s', msgs.join('.').trim());
  }
  process.exit(1);
}
