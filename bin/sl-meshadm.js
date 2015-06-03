#!/usr/bin/env node
/* eslint no-console:0 no-process-exit:0 */

var Client = require('../client/client');
var Parser = require('posix-getopt').BasicParser;
var assert = require('assert');
var debug = require('debug')('strong-mesh-models:meshadm');
var fs = require('fs');
var path = require('path');
var table = require('text-table');
var userHome = require('user-home');
var maybeTunnel = require('strong-tunnel');

assert(userHome, 'User home directory cannot be determined!');

function printHelp($0, prn) {
  var USAGE = fs.readFileSync(require.resolve('./sl-meshadm.txt'), 'utf-8')
    .replace(/%MAIN%/g, $0)
    .trim();

  prn(USAGE);
}

var argv = process.argv;
var $0 = process.env.CMD || path.basename(argv[1]);
var parser = new Parser([
  ':v(version)',
  'h(help)',
  'C:(control)',
  'V(verbose)'
].join(''), argv);

var apiUrl = process.env.STRONGLOOP_MESH_API ||
  process.env.STRONGLOOP_PM ||
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

dieIf.url = apiUrl;
maybeTunnel(apiUrl, sshOpts, function(err, apiUrl) {
  dieIf.url = apiUrl || dieIf.url;
  dieIf(err);
  var client = new Client(apiUrl);

  client.checkRemoteApiSemver(function(err) {
    dieIf(err);
    runCommand(client, command);
  });
});

function runCommand(client, command) {
  ({
    'executor-create': cmdCreateExecutor,
    'executor-list': cmdListExecutors,
    'executor-remove': cmdRemoveExecutor,
  }[command] || unknown)(client);
}

function unknown() {
  console.error('Unknown command: %s, try `%s --help`.', command, $0);
  process.exit(1);
}

function cmdCreateExecutor(client) {
  var driver = optional('executor');

  client.executorCreate(driver, function(err, result) {
    debug('executor-create: %j', err || result);
    dieIf(err);
    console.log('Created Executor id: %s token: %j',
      result.id, result.token);
  });
}

function cmdListExecutors(client) {
  client.executorList(function(err, result) {
    debug('executor-list: %j', err || result);
    dieIf(err);

    if (result.length) {
      var data = [];
      data.push(['Id', 'Host', 'IP', 'Capacity', 'Token', 'Metadata']);
      for (var i in result) {
        if (!result.hasOwnProperty(i)) continue;
        var s = result[i];

        data.push([
          s.id, s.hostname || 'n/a', s.address || 'n/a',
          s.totalCapacity || 'n/a', s.token, JSON.stringify(s.metadata || {})
        ]);
      }
      console.log(table(data, {align: ['c', 'c', 'c', 'c', 'c', 'c']}));
    } else {
      console.log('No executors defined');
    }
  });
}

function cmdRemoveExecutor(client) {
  var id = mandatory('id');

  client.executorDestroy(id, function(err, result) {
    debug('executor-destroy: %j', err || result);
    dieIf(err);
    console.log('Destroyed executor: %s', id);
  });
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
  var msgs = msg.split('. ');

  console.error('Command %j on %j failed with %s',
                command, dieIf.url, msgs.shift());
  if (msgs.length) {
    console.error('%s', msgs.join('. ').trim());
  }
  process.exit(1);
}
