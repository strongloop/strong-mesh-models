var assert = require('assert');
var exec = require('./exec-meshctl');
var test = require('tap').test;
var testCmdHelper = require('./meshctl-helper');
var util = require('util');
var ServiceManager = require('../index').ServiceManager;

test('Test stop command', function(t) {
  function TestServiceManager() {
  }
  util.inherits(TestServiceManager, ServiceManager);

  testCmdHelper(t, TestServiceManager, function(t, service, instance, port) {
    t.test('Setup service manager (hard stop)', function(tt) {
      function onCtlRequest(s, i, req, callback) {
        assert.deepEqual(req, {cmd: 'stop'}, 'Request should match');
        callback(null, {message: 'hard stopped with status SIGTERM'});
      }
      TestServiceManager.prototype.onCtlRequest = onCtlRequest;
      tt.end();
    });

    t.test('Stop API (hard stop)', function(tt) {
      service.stop({}, function(err, responses) {
        tt.ifError(err, 'call should not error');
        tt.equal(responses[0].response.message,
          'hard stopped with status SIGTERM',
          'response should match');
        tt.end();
      });
    });

    t.test('Stop CLI (hard stop)', function(tt) {
      exec.resetHome();
      exec(port, 'stop 1', function(err, stdout) {
        tt.ifError(err, 'command should not error');
        tt.equal(stdout, 'Service "service 1" hard stopped\n',
          'Rendered output should match');
        tt.end();
      });
    });

    t.test('Setup service manager (soft stop)', function(tt) {
      function onCtlRequest(s, i, req, callback) {
        assert.deepEqual(req, {cmd: 'soft-stop'}, 'Request should match');
        callback(null, {message: 'soft stopped with status 0'});
      }
      TestServiceManager.prototype.onCtlRequest = onCtlRequest;
      tt.end();
    });

    t.test('Stop API (soft stop)', function(tt) {
      service.stop({soft: true}, function(err, responses) {
        tt.ifError(err, 'call should not error');
        tt.equal(responses[0].response.message,
          'soft stopped with status 0',
          'Status response should match');
        tt.end();
      });
    });

    t.test('Stop CLI (soft stop)', function(tt) {
      exec.resetHome();
      exec(port, 'soft-stop 1', function(err, stdout) {
        tt.ifError(err, 'command should not error');
        tt.equal(stdout, 'Service "service 1" soft stopped\n',
          'Rendered output should match');
        tt.end();
      });
    });

    t.test('Setup service manager (failure case)', function(tt) {
      function onCtlRequest(s, i, req, callback) {
        assert.deepEqual(req, {cmd: 'stop'}, 'Request should match');
        callback(Error('application not running, so cannot be stopped'));
      }
      TestServiceManager.prototype.onCtlRequest = onCtlRequest;
      tt.end();
    });

    t.test('Start API (failure case)', function(tt) {
      service.stop({}, function(err, responses) {
        tt.ifError(err);
        tt.ok(responses[0].error, 'call should error');
        tt.end();
      });
    });

    t.test('Status summary CLI (failure case)', function(tt) {
      exec.resetHome();
      exec(port, 'stop 1', function(err, stdout, stderr) {
        tt.ok(err, 'command should error');
        var patt = /Command "stop" on "\S+" failed with error/;
        tt.assert(patt.test(stderr), 'Rendered error should match');
        tt.end();
      });
    });
  });
});
