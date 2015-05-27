var assert = require('assert');
var exec = require('./exec-meshctl');
var test = require('tap').test;
var testCmdHelper = require('./meshctl-helper');
var util = require('util');
var ServiceManager = require('../index').ServiceManager;

test('Test set-size command', function(t) {
  function TestServiceManager() {
  }
  util.inherits(TestServiceManager, ServiceManager);

  testCmdHelper(t, TestServiceManager, function(t, service, instance, port) {
    t.test('Setup service manager (non-persisted)', function(tt) {
      function onCtlRequest(s, i, req, callback) {
        assert.deepEqual(req, {cmd: 'current', sub: 'set-size', size: 2});
        callback(null, {message: 'size was changed'});
      }
      TestServiceManager.prototype.onCtlRequest = onCtlRequest;
      tt.end();
    });

    t.test('set-size API (non-persisted)', function(tt) {
      service.setClusterSize(2, false, function(err, responses) {
        tt.ifError(err, 'call should not error');
        tt.equal(responses[0].response.message, 'size was changed',
          'response should match');
        tt.end();
      });
    });

    t.test('set-size CLI (non-persisted)', function(tt) {
      exec.resetHome();
      exec(port, 'set-size 1 2', function(err, stdout) {
        tt.ifError(err, 'command should not error');
        tt.equal(stdout, '',
          'Rendered output should match');
        tt.end();
      });
    });

    t.test('Setup service manager (persisted)', function(tt) {
      function onCtlRequest(s, i, req, callback) {
        assert.deepEqual(req, {cmd: 'current', sub: 'set-size', size: 3});
        callback(null, {message: 'size was changed'});
      }
      TestServiceManager.prototype.onCtlRequest = onCtlRequest;

      function onInstanceUpdate(instance, isNew, callback) {
        assert.equal(instance.cpus, 3);
        callback();
      }
      TestServiceManager.prototype.onInstanceUpdate = onInstanceUpdate;

      tt.end();
    });

    t.test('set-size API (persisted)', function(tt) {
      service.setClusterSize(3, true, function(err, responses) {
        tt.ifError(err, 'call should not error');
        tt.equal(responses[0].response.message, 'size was changed',
          'response should match');
        tt.end();
      });
    });

    t.test('Setup service manager (no app, persist case)', function(tt) {
      function onCtlRequest(s, i, req, callback) {
        assert.deepEqual(req, {cmd: 'current', sub: 'set-size', size: 4});
        callback(Error('application not running'));
      }
      TestServiceManager.prototype.onCtlRequest = onCtlRequest;

      function onInstanceUpdate(instance, isNew, callback) {
        assert.equal(instance.cpus, 4);
        callback();
      }
      TestServiceManager.prototype.onInstanceUpdate = onInstanceUpdate;
      tt.end();
    });

    t.test('set-size API (no app, persist case)', function(tt) {
      service.setClusterSize(4, true, function(err) {
        tt.ifError(err, 'call should not error');
        tt.end();
      });
    });

    t.test('Setup service manager (failure case)', function(tt) {
      function onCtlRequest(s, i, req, callback) {
        assert.deepEqual(req, {cmd: 'current', sub: 'set-size', size: 5});
        callback(Error('application not running'));
      }
      TestServiceManager.prototype.onCtlRequest = onCtlRequest;
      tt.end();
    });

    t.test('set-size API (failure case)', function(tt) {
      service.setClusterSize(5, false, function(err, responses) {
        tt.ifError(err);
        tt.ok(responses[0].error, 'call should error');
        tt.end();
      });
    });

    t.test('set-size CLI (failure case)', function(tt) {
      exec.resetHome();
      exec(port, 'set-size 1 5', function(err, stdout, stderr) {
        tt.ok(err, 'command should error');
        var patt = /Command "set-size" on "\S+" failed with error/;
        tt.assert(patt.test(stderr), 'Rendered error should match');
        tt.end();
      });
    });
  });
});
