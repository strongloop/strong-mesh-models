var assert = require('assert');
var exec = require('./exec-meshctl');
var test = require('tap').test;
var testCmdHelper = require('./meshctl-helper');
var util = require('util');
var ServiceManager = require('../index').ServiceManager;

test('Test status command', function(t) {
  function TestServiceManager() {
  }
  util.inherits(TestServiceManager, ServiceManager);

  var BASE = '/strongloop/strong-pm/.strong-pm';
  var STATUS = {
    pid: 90422,
    port: 8701,
    cwd: BASE,
    base: BASE,
    current: {
      pwd: BASE + '/work/current',
      cwd: BASE + '/work/462df261bc2a8df5455289a801f91ad7a95e8bb0',
      config: {
        prepare: ['npm rebuild', 'npm install --production'],
        start: ['sl-run --cluster=CPU'],
        stop: ['SIGTERM'],
        replace: ['SIGHUP'],
        files: {}
      },
      pid: 90423,
      workers: [{
        id: '1',
        pid: 90424,
        uptime: 4915
      }]
    }
  };

  var RENDERED_STATUS = [
    'manager:',
    '  pid:                90422',
    '  port:               8701',
    '  base:               /strongloop/strong-pm/.strong-pm',
    'current:',
    '  status:             started',
    '  pid:                90423',
    '  link:               /strongloop/strong-pm/.strong-pm/work/current',
    '  current:            462df261bc2a8df5455289a801f91ad7a95e8bb0',
    '  worker count:       1',
    '    [1]:              cluster id 1, pid 90424',
    ''
  ].join('\n');

  testCmdHelper(t, TestServiceManager, function(t, service, instance, port) {
    t.test('Setup service manager', function(tt) {
      function ctlRequest(s, i, req, callback) {
        assert.deepEqual(req, {cmd: 'status'}, 'Request should match');
        callback(null, STATUS);
      }
      TestServiceManager.prototype.ctlRequest = ctlRequest;
      tt.end();
    });

    t.test('Status summary API', function(tt) {
      instance.statusSummary(function(err, status) {
        tt.ifError(err, 'status call should not error');
        tt.deepEqual(status, STATUS, 'Status response should match');
        tt.end();
      });
    });

    t.test('Status summary CLI', function(tt) {
      exec.resetHome();
      exec(port, 'status', function(err, stdout) {
        tt.ifError(err, 'command should not error');
        tt.equal(RENDERED_STATUS, stdout, 'Rendered status should match');
        tt.end();
      });
    });
  });
});
