var assert = require('assert');
var exec = require('./exec-meshctl');
var test = require('tap').test;
var testCmdHelper = require('./meshctl-helper');
var util = require('util');
var ServiceManager = require('../index').ServiceManager;

test('Test env commands', function(t) {
  function TestServiceManager() {
  }
  util.inherits(TestServiceManager, ServiceManager);

  testCmdHelper(t, TestServiceManager, function(t, service, instance, port) {
    t.test('Setup service manager', function(tt) {
      function ctlRequest(s, i, req, callback) {
        assert.deepEqual(req,
          {
            cmd: 'env-set',
            env: {A: 1, B: 2}
          });
        callback(null, {message: 'env set'});
      }

      TestServiceManager.prototype.ctlRequest = ctlRequest;
      tt.end();
    });

    t.test('env-set API', function(tt) {
      instance.envSet({A: 1, B: 2}, function(err, response) {
        tt.ifError(err, 'call should not error');
        assert.equal(response.message, 'env set');
        tt.end();
      });
    });

    t.test('env-set CLI', function(tt) {
      exec.resetHome();
      exec(port, 'env-set A=1 B=2', function(err, stdout) {
        tt.ifError(err, 'command should not error');
        tt.equal(stdout, 'Environment updated: "env set"\n',
          'Rendered output should match');
        tt.end();
      });
    });

    t.test('Setup service manager', function(tt) {
      function ctlRequest(s, i, req, callback) {
        assert.deepEqual(req,
          {
            cmd: 'env-set',
            env: {A: null, B: null}
          });
        callback(null, {message: 'env set'});
      }

      TestServiceManager.prototype.ctlRequest = ctlRequest;
      tt.end();
    });

    t.test('env-unset CLI', function(tt) {
      exec.resetHome();
      exec(port, 'env-unset A B', function(err, stdout) {
        tt.ifError(err, 'command should not error');
        tt.equal(stdout, 'Environment updated: "env set"\n',
          'Rendered output should match');
        tt.end();
      });
    });

    t.test('Setup service manager (failure case)', function(tt) {
      function ctlRequest(s, i, req, callback) {
        callback(Error('bad stuff'));
      }

      TestServiceManager.prototype.ctlRequest = ctlRequest;
      tt.end();
    });

    t.test('env-set API (failure case)', function(tt) {
      instance.envSet({A: 1, B: 2}, function(err /*, response*/) {
        tt.ok(err, 'call should error');
        tt.end();
      });
    });

    t.test('env-set CLI (failure case)', function(tt) {
      exec.resetHome();
      exec(port, 'env-set A=1 B=2', function(err, stdout, stderr) {
        tt.ok(err, 'command should error');
        tt.equal(stderr, 'Command env-set failed with Error: bad stuff\n',
          'Rendered error should match');
        tt.end();
      });
    });

    t.test('env-unset CLI (failure case)', function(tt) {
      exec.resetHome();
      exec(port, 'env-unset C', function(err, stdout, stderr) {
        tt.ok(err, 'command should error');
        tt.equal(stderr, 'Command env-unset failed with Error: bad stuff\n',
          'Rendered error should match');
        tt.end();
      });
    });
  });
});
