var assert = require('assert');
var exec = require('./exec-meshctl');
var test = require('tap').test;
var testCmdHelper = require('./meshctl-helper');
var util = require('util');
var ServiceManager = require('../index').ServiceManager;

test('Test restart command', function(t) {
  function TestServiceManager() {
  }
  util.inherits(TestServiceManager, ServiceManager);

  testCmdHelper(t, TestServiceManager, function(t, service, instance, port) {
    t.test('Setup service manager (hard restart)', function(tt) {
      function onCtlRequest(s, i, req, callback) {
        assert.deepEqual(req, {cmd: 'restart'}, 'Request should match');
        callback(null,
          {message: 'hard stopped with status SIGTERM, restarting...'});
      }
      TestServiceManager.prototype.onCtlRequest = onCtlRequest;
      tt.end();
    });

    t.test('Restart API (hard restart)', function(tt) {
      service.restart({}, function(err, responses) {
        tt.ifError(err, 'call should not error');
        tt.equal(responses[0].response.message,
          'hard stopped with status SIGTERM, restarting...',
          'response should match');
        tt.end();
      });
    });

    t.test('Restart CLI (hard restart)', function(tt) {
      exec.resetHome();
      exec(port, 'restart 1', function(err, stdout) {
        tt.ifError(err, 'command should not error');
        tt.equal(stdout, 'Service "service 1" restarting\n',
          'Rendered output should match');
        tt.end();
      });
    });

    t.test('Setup service manager (soft restart)', function(tt) {
      function onCtlRequest(s, i, req, callback) {
        assert.deepEqual(req, {cmd: 'soft-restart'}, 'Request should match');
        callback(null, {message: 'soft stopped with status 0, restarting...'});
      }
      TestServiceManager.prototype.onCtlRequest = onCtlRequest;
      tt.end();
    });

    t.test('Restart API (soft restart)', function(tt) {
      service.restart({soft: true}, function(err, responses) {
        tt.ifError(err, 'call should not error');
        tt.equal(responses[0].response.message,
          'soft stopped with status 0, restarting...',
          'response should match');
        tt.end();
      });
    });

    t.test('Restart CLI (soft restart)', function(tt) {
      exec.resetHome();
      exec(port, 'soft-restart 1', function(err, stdout) {
        tt.ifError(err, 'command should not error');
        tt.equal(stdout, 'Service "service 1" soft restarting\n',
          'Rendered output should match');
        tt.end();
      });
    });

    t.test('Setup service manager (rolling restart)', function(tt) {
      function onCtlRequest(s, i, req, callback) {
        assert.deepEqual(req, {cmd: 'current', sub: 'restart'},
          'Request should match');
        callback(null, {message: 'discarded message'});
      }
      TestServiceManager.prototype.onCtlRequest = onCtlRequest;
      tt.end();
    });

    t.test('Restart API (rolling restart)', function(tt) {
      service.restart({rolling: true}, function(err, responses) {
        tt.ifError(err, 'call should not error');
        tt.equal(responses[0].response.message, 'discarded message',
          'response should match');
        tt.end();
      });
    });

    t.test('Restart CLI (rolling restart)', function(tt) {
      exec.resetHome();
      exec(port, 'cluster-restart 1', function(err, stdout) {
        tt.ifError(err, 'command should not error');
        tt.equal(stdout, '', 'Rendered output should match');
        tt.end();
      });
    });

    t.test('Setup service manager (failure case)', function(tt) {
      function onCtlRequest(s, i, req, callback) {
        assert.deepEqual(req, {cmd: 'restart'}, 'Request should match');
        callback(Error('application not running, so cannot be stopped'));
      }
      TestServiceManager.prototype.onCtlRequest = onCtlRequest;
      tt.end();
    });

    t.test('Restart API (failure case)', function(tt) {
      service.restart({}, function(err, responses) {
        tt.ifError(err);
        tt.ok(responses[0].error, 'call should error');
        tt.end();
      });
    });

    t.test('Restart CLI (failure case)', function(tt) {
      exec.resetHome();
      exec(port, 'restart 1', function(err, stdout, stderr) {
        tt.ok(err, 'command should error');
        var patt = /Command "restart" on "\S+" failed with error/;
        tt.assert(patt.test(stderr), 'Rendered error should match');
        tt.end();
      });
    });
  });
});
