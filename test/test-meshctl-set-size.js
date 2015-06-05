var debug = require('debug')('strong-mesh-models:test');
var exec = require('./exec-meshctl');
var test = require('tap').test;
var testCmdHelper = require('./meshctl-helper');
var util = require('util');
var ServiceManager = require('../index').ServiceManager;

// Note in the following:
// - persistent size changes show up only as an instance update. Its the drivers
//   job to send any control messages to update the size if the app is running.
// - non-persistent size changes show up only as a set-size control message.

test('Test set-size command', function(t) {
  function TestServiceManager() {
  }
  util.inherits(TestServiceManager, ServiceManager);

  testCmdHelper(t, TestServiceManager, function(t, service, instance, port) {
    t.test('set-size API (non-persisted)', function(tt) {
      tt.plan(3);

      function onCtlRequest(s, i, req, callback) {
        debug('onCtlRequest:', req);
        tt.match(req, {cmd: 'current', sub: 'set-size', size: 2});
        callback(null, {message: 'size was changed'});
      }
      TestServiceManager.prototype.onCtlRequest = onCtlRequest;

      service.setClusterSize(2, false, function(err, responses) {
        tt.ifError(err, 'call should not error');
        tt.equal(responses[0].response.message, 'size was changed',
          'response should match');
        tt.end();
      });
    });

    t.test('set-size CLI (persisted)', function(tt) {
      tt.plan(3);

      function onCtlRequest(s, i, req, callback) {
        tt.fail('should not be called');
        callback(Error('application not running')); // Don't timeout on fail
      }
      TestServiceManager.prototype.onCtlRequest = onCtlRequest;

      function onInstanceUpdate(instance, callback) {
        tt.same(instance.cpus, 2);
        callback();
      }
      TestServiceManager.prototype.onInstanceUpdate = onInstanceUpdate;

      exec.resetHome();
      exec(port, 'set-size 1 2', function(err, stdout) {
        tt.ifError(err, 'command should not error');
        tt.match(stdout, /Service.*size was set to 2/,
          'Rendered output should match');
        tt.end();
      });
    });

    t.test('set-size API (persisted)', function(tt) {
      tt.plan(3);

      function onCtlRequest(s, i, req, callback) {
        tt.fail('should not be called');
        callback(Error('application not running')); // Don't timeout on fail
      }
      TestServiceManager.prototype.onCtlRequest = onCtlRequest;

      function onInstanceUpdate(instance, isNew, callback) {
        tt.same(instance.cpus, 3);
        callback();
      }
      TestServiceManager.prototype.onInstanceUpdate = onInstanceUpdate;

      service.setClusterSize(3, true, function(err, responses) {
        tt.ifError(err, 'call should not error');
        tt.equal(responses[0].response.message, 'size was changed',
          'response should match');
        tt.end();
      });
    });

    t.test('set-size API (no app, persist case)', function(tt) {
      tt.plan(2);

      function onCtlRequest(s, i, req, callback) {
        tt.fail('should not be called');
        callback(Error('application not running')); // Don't timeout on fail
      }
      TestServiceManager.prototype.onCtlRequest = onCtlRequest;

      function onInstanceUpdate(instance, isNew, callback) {
        tt.same(instance.cpus, 4);
        callback();
      }
      TestServiceManager.prototype.onInstanceUpdate = onInstanceUpdate;

      service.setClusterSize(4, true, function(err) {
        tt.ifError(err, 'call should not error');
        tt.end();
      });
    });

    t.test('set-size API (failure case)', function(tt) {
      tt.plan(3);

      function onCtlRequest(s, i, req, callback) {
        tt.match(req, {cmd: 'current', sub: 'set-size', size: 5});
        callback(Error('FAILURE'));
      }
      TestServiceManager.prototype.onCtlRequest = onCtlRequest;

      service.setClusterSize(5, false, function(err, responses) {
        tt.ifError(err);
        tt.equal(responses[0].error, 'FAILURE', 'call should error');
        tt.end();
      });
    });
  });
});
