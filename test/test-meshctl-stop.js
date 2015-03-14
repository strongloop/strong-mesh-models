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
      function ctlRequest(s, i, req, callback) {
        assert.deepEqual(req, {cmd: 'stop'}, 'Request should match');
        callback(null, {message: 'hard stopped with status SIGTERM'});
      }
      TestServiceManager.prototype.ctlRequest = ctlRequest;
      tt.end();
    });

    t.test('Stop API (hard stop)', function(tt) {
      instance.appStop({}, function(err, response) {
        tt.ifError(err, 'call should not error');
        tt.equal(response.message, 'hard stopped with status SIGTERM',
          'response should match');
        tt.end();
      });
    });

    t.test('Stop CLI (hard stop)', function(tt) {
      exec.resetHome();
      exec(port, 'stop', function(err, stdout) {
        tt.ifError(err, 'command should not error');
        tt.equal(stdout, 'hard stopped with status SIGTERM\n',
          'Rendered output should match');
        tt.end();
      });
    });

    t.test('Setup service manager (soft stop)', function(tt) {
      function ctlRequest(s, i, req, callback) {
        assert.deepEqual(req, {cmd: 'soft-stop'}, 'Request should match');
        callback(null, {message: 'soft stopped with status 0'});
      }
      TestServiceManager.prototype.ctlRequest = ctlRequest;
      tt.end();
    });

    t.test('Stop API (soft stop)', function(tt) {
      instance.appStop({soft: true}, function(err, response) {
        tt.ifError(err, 'call should not error');
        tt.equal(response.message, 'soft stopped with status 0',
          'Status response should match');
        tt.end();
      });
    });

    t.test('Stop CLI (soft stop)', function(tt) {
      exec.resetHome();
      exec(port, 'soft-stop', function(err, stdout) {
        tt.ifError(err, 'command should not error');
        tt.equal(stdout, 'soft stopped with status 0\n',
          'Rendered output should match');
        tt.end();
      });
    });

    t.test('Setup service manager (failure case)', function(tt) {
      function ctlRequest(s, i, req, callback) {
        assert.deepEqual(req, {cmd: 'stop'}, 'Request should match');
        callback(Error('application not running, so cannot be stopped'));
      }
      TestServiceManager.prototype.ctlRequest = ctlRequest;
      tt.end();
    });

    t.test('Start API (failure case)', function(tt) {
      instance.appStop({}, function(err, response) {
        tt.ok(err, 'call should error: ' + err || response);
        tt.end();
      });
    });

    t.test('Status summary CLI (failure case)', function(tt) {
      exec.resetHome();
      exec(port, 'stop', function(err, stdout, stderr) {
        tt.ok(err, 'command should error');
        tt.equal(stderr, 'Command stop failed with Error: ' +
          'application not running, so cannot be stopped\n',
          'Rendered error should match');
        tt.end();
      });
    });
  });
});
