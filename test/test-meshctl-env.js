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
      function onCtlRequest(s, i, req, callback) {
        assert.deepEqual(req,
          {
            cmd: 'env-set',
            env: {A: 1, B: 2}
          });
        s.env = req.env;
        s.save(function(err) {
          callback(err, {message: 'env set'});
        });
      }

      TestServiceManager.prototype.onCtlRequest = onCtlRequest;
      tt.end();
    });

    t.test('env-set API', function(tt) {
      service.setEnvs({A: 1, B: 2}, function(err, response) {
        tt.ifError(err, 'call should not error');
        assert.deepEqual(response, {A: 1, B: 2});
        tt.end();
      });
    });

    t.test('env-set CLI', function(tt) {
      exec.resetHome();
      exec(port, 'env-set 1 A=1 B=2', function(err, stdout) {
        tt.ifError(err, 'command should not error');
        tt.equal(stdout, 'Service "service 1" environment updated\n' +
          '    Name  Value\n' +
          '    A     1\n' +
          '    B     2\n',
          'Rendered output should match');
        tt.end();
      });
    });

    t.test('env-set CLI with complex values', function(tt) {
      exec.resetHome();
      exec(port, 'env-set 1 URL=db://host?foo=bar', function(err, stdout) {
        tt.ifError(err, 'command should not error');
        tt.equal(stdout, 'Service "service 1" environment updated\n' +
          '    Name  Value\n' +
          '    A     1\n' +
          '    B     2\n' +
          '    URL   db://host?foo=bar\n',
          'Rendered output should match');
        tt.end();
      });
    });

    t.test('Setup service manager', function(tt) {
      function onCtlRequest(s, i, req, callback) {
        assert.deepEqual(req,
          {
            cmd: 'env-set',
            env: {A: null, B: null}
          });
        s.env = {};
        s.save(function(err) {
          callback(err, {message: 'env set'});
        });
      }

      TestServiceManager.prototype.onCtlRequest = onCtlRequest;
      tt.end();
    });

    t.test('env-unset CLI', function(tt) {
      exec.resetHome();
      exec(port, 'env-unset 1 A B URL', function(err, stdout) {
        tt.ifError(err, 'command should not error');
        tt.equal(stdout, 'Service "service 1" environment updated\n' +
          '  No environment variables defined\n',
          'Rendered output should match');
        tt.end();
      });
    });

    t.test('Setup service manager (failure case)', function(tt) {
      function onServiceUpdate(service, isNew, callback) {
        callback(Error('bad stuff'));
      }
      TestServiceManager.prototype.onServiceUpdate = onServiceUpdate;

      tt.end();
    });

    t.test('env-set API (failure case)', function(tt) {
      service.setEnvs({A: 1, B: 2}, function(err /*, response*/) {
        tt.ok(err, 'call should error');
        tt.end();
      });
    });

    t.test('env-set CLI (failure case)', function(tt) {
      exec.resetHome();
      exec(port, 'env-set 1 A=1 B=2', function(err, stdout, stderr) {
        tt.ok(err, 'command should error');
        var patt = /Command "env-set" on "\S+" failed with Error: bad stuff/;
        tt.assert(patt.test(stderr), 'Rendered error should match');
        tt.end();
      });
    });

    t.test('env-unset CLI (failure case)', function(tt) {
      exec.resetHome();
      exec(port, 'env-unset 1 C', function(err, stdout, stderr) {
        tt.ok(err, 'command should error');
        var patt = /Command "env-unset" on "\S+" failed with Error: bad stuff/;
        tt.assert(patt.test(stderr), 'Rendered error should match');
        tt.end();
      });
    });
  });
});
