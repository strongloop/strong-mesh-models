#!/usr/bin/env node
/* eslint no-console:0 no-process-exit:0 */

var Client = require('../client/client');
var Parser = require('posix-getopt').BasicParser;
var _ = require('lodash');
var assert = require('assert');
var home = require('osenv').home();
var debug = require('debug')('strong-mesh-client:meshctl');
var fs = require('fs');
var path = require('path');
var userHome = require('user-home');
var url = require('url');
var util = require('util');
var sprintf = require('sprintf');
var urlDefaults = require('strong-url-defaults');

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
  '/var/lib/strong-pm/pmctl';

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

if (!url.parse(apiUrl).protocol) {
  apiUrl = 'http+unix://' + path.resolve(apiUrl);
} else {
  apiUrl = urlDefaults(apiUrl, {host: '127.0.0.1', port: 8701});
}
var client = new Client(apiUrl);

var serviceId = process.env.STRONG_MESH_SERVICE_ID || '1';
var instanceId = process.env.STRONG_MESH_INSTANCE_ID || '1';

client.instanceFind(instanceId, function(err, instance) {
  dieIf(err);
  ({
    'status': cmdStatus,
    'start': cmdStart,
  }[command] || unknown)(instance);
});


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
    fmt(1, 'config', '%s', rsp.config);

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
    console.log(response.toString());
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

function optional(def) {
  if (optind >= argv.length) {
    return def;
  }

  return argv[optind++];
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
