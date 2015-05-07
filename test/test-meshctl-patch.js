var ServiceManager = require('../index').ServiceManager;
var assert = require('assert');
var exec = require('./exec-meshctl');
var fs = require('fs');
var test = require('tap').test;
var testCmdHelper = require('./meshctl-helper');
var util = require('util');

test('Test patch commands', function(t) {
  function TestServiceManager() {
  }
  util.inherits(TestServiceManager, ServiceManager);

  testCmdHelper(t, TestServiceManager, function(t, service, instance, port) {
    t.test('Setup service manager (patch)', function(tt) {
      function onCtlRequest(s, i, req, callback) {
        assert.equal(req.cmd, 'current');
        assert.equal(req.sub, 'patch');
        assert.equal(req.target, 1231);
        assert.deepEqual(req.patch, {file: 'some patch data'});
        callback(null, {ok: true});
      }
      TestServiceManager.prototype.onCtlRequest = onCtlRequest;
      tt.end();
    });

    t.test('patch API', function(tt) {
      instance.processes({where: {pid: 1231}}, function(err, proc) {
        tt.ifError(err, 'call should not error');
        proc = proc[0];
        proc.applyPatch({file: 'some patch data'}, function(err, response) {
          tt.ifError(err, 'call should not error');
          tt.deepEqual(response, {
            ok: true
          }, 'Response should match');
          tt.end();
        });
      });
    });

    t.test('patch CLI', function(tt) {
      exec.resetHome();
      fs.writeFileSync('patch.file', '{"file": "some patch data"}');
      exec(port, 'patch 1 patch.file', function(err, stdout) {
        tt.ifError(err, 'command should not error');
        tt.equal(stdout, '');
        tt.end();
      });
    });

    t.test('Setup service manager (error)', function(tt) {
      function onCtlRequest(s, i, req, callback) {
        assert.equal(req.cmd, 'current');
        assert.equal(req.sub, 'patch');
        assert.equal(req.target, 1231);
        assert.deepEqual(req.patch, {file: 'some patch data'});
        callback(Error('some error'));
      }
      TestServiceManager.prototype.onCtlRequest = onCtlRequest;
      tt.end();
    });

    t.test('Start snapshot API (error)', function(tt) {
      instance.processes({where: {pid: 1231}}, function(err, proc) {
        tt.ifError(err, 'call should not error');
        proc = proc[0];
        proc.applyPatch({file: 'some patch data'}, function(err) {
          tt.ok(err, 'patch operation should error');
          tt.end();
        });
      });
    });

    t.test('patch CLI (error)', function(tt) {
      exec.resetHome();
      fs.writeFileSync('patch.file', '{"file": "some patch data"}');
      exec(port, 'patch 1 patch.file', function(err, stdout, stderr) {
        tt.ok(err, 'command should error');
        var patt = /Command "patch" on "\S+" failed with Error: some error/;
        tt.assert(patt.test(stderr), 'Rendered error should match');
        tt.end();
      });
    });
  });
});
