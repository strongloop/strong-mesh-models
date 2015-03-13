var assert = require('assert');
var exec = require('./exec-meshctl');
var test = require('tap').test;
var testCmdHelper = require('./meshctl-helper');
var util = require('util');
var ServiceManager = require('../index').ServiceManager;

test('Test start command', function(t) {
  function TestServiceManager() {
  }
  util.inherits(TestServiceManager, ServiceManager);

  testCmdHelper(t, TestServiceManager, function(t, service, instance, port) {
    t.test('Setup service manager', function(tt) {
      function ctlRequest(s, i, req, callback) {
        assert.deepEqual(req, {cmd: 'start'}, 'Request should match');
        callback(null, {message: 'starting...'});
      }
      TestServiceManager.prototype.ctlRequest = ctlRequest;
      tt.end();
    });

    t.test('Start API', function(tt) {
      instance.appStart(function(err, response) {
        tt.ifError(err, 'call should not error');
        tt.equal(response.message, 'starting...',
          'response should match');
        tt.end();
      });
    });

    t.test('Start CLI', function(tt) {
      exec.resetHome();
      exec(port, 'start', function(err, stdout) {
        tt.ifError(err, 'command should not error');
        tt.equal(stdout, 'starting...\n', 'Rendered output should match');
        tt.end();
      });
    });

    t.test('Setup service manager (failure case)', function(tt) {
      function ctlRequest(s, i, req, callback) {
        assert.deepEqual(req, {cmd: 'start'}, 'Request should match');
        callback(Error('application running, so cannot be started'));
      }
      TestServiceManager.prototype.ctlRequest = ctlRequest;
      tt.end();
    });

    t.test('Start API (failure case)', function(tt) {
      instance.appStart(function(err, status) {
        tt.ok(err, 'call should error: ' + err || status);
        tt.end();
      });
    });

    t.test('Start CLI (failure case)', function(tt) {
      exec.resetHome();
      exec(port, 'start', function(err, stdout, stderr) {
        tt.ok(err, 'command should error');
        tt.equal(stderr, 'Command start failed with Error: ' +
          'application running, so cannot be started\n',
          'Rendered error should match');
        tt.end();
      });
    });
  });
});
