var ServiceManager = require('../index').ServiceManager;
var assert = require('assert');
var exec = require('./exec-meshctl');
var test = require('tap').test;
var testCmdHelper = require('./meshctl-helper');
var util = require('util');

test('Test tracing commands', function(t) {
  function TestServiceManager() {
  }
  util.inherits(TestServiceManager, ServiceManager);

  testCmdHelper(t, TestServiceManager, function(t, service, instance, port) {
    t.test('Setup service manager (start tracing)', function(tt) {
      function onCtlRequest(s, i, req, callback) {
        assert.deepEqual(req, {
          cmd: 'current', sub: 'tracing',
          enabled: true,
        });
        callback(null, {});
      }
      TestServiceManager.prototype.onCtlRequest = onCtlRequest;
      tt.end();
    });

    t.test('Start tracing API', function(tt) {
      instance.tracingStart(function(err, status) {
        tt.ifError(err, 'call should not error');
        tt.deepEqual(status, {message: 'tracing started'},
          'Response should match');
        tt.end();
      });
    });

    t.test('Start tracing CLI', function(tt) {
      exec.resetHome();
      exec(port, 'tracing-start 1', function(err, stdout) {
        tt.ifError(err, 'command should not error');
        tt.equal(stdout, 'Tracing started\n',
          'Rendered status should match');
        tt.end();
      });
    });

    t.test('Setup service manager (error)', function(tt) {
      function onCtlRequest(s, i, req, callback) {
        assert.deepEqual(req, {
          cmd: 'current', sub: 'tracing',
          enabled: true,
        });
        callback(Error('something bad happened'));
      }
      TestServiceManager.prototype.onCtlRequest = onCtlRequest;
      tt.end();
    });

    t.test('Setup service manager (stop tracing)', function(tt) {
      function onCtlRequest(s, i, req, callback) {
        assert.equal(req.cmd, 'current');
        assert.equal(req.sub, 'tracing');
        assert.equal(req.enabled, false);
        callback(null, {});
      }
      TestServiceManager.prototype.onCtlRequest = onCtlRequest;
      tt.end();
    });

    t.test('Stop tracing API', function(tt) {
      instance.tracingStop(function(err, status) {
        tt.ifError(err, 'call should not error');
        tt.deepEqual(status, {message: 'tracing stopped'},
          'Response should match');
        tt.end();
      });
    });

    t.test('Stop tracing CLI', function(tt) {
      exec.resetHome();
      exec(port, 'tracing-stop 1', function(err, stdout) {
        tt.ifError(err, 'command should not error');
        tt.equal(stdout, 'Tracing stopped\n',
          'Rendered status should match');
        tt.end();
      });
    });
  });
});
