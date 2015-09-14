var ServiceManager = require('../index').ServiceManager;
var assert = require('assert');
var exec = require('./exec-meshctl');
var test = require('tap').test;
var testCmdHelper = require('./meshctl-helper');
var util = require('util');

test('Test cpu-profiling commands', function(t) {
  function TestServiceManager() {
  }
  util.inherits(TestServiceManager, ServiceManager);

  testCmdHelper(t, TestServiceManager, function(t, service, instance, port) {
    t.test('Setup service manager (start debugger)', function(tt) {
      function onCtlRequest(s, i, req, callback) {
        assert.deepEqual(req, {
          cmd: 'current', sub: 'dbg-start',
          target: 1231
        });
        callback(null, {port: 12345});
      }
      TestServiceManager.prototype.onCtlRequest = onCtlRequest;
      tt.end();
    });

    t.test('Start debugger API', function(tt) {
      instance.processes({where: {pid: 1231}}, function(err, proc) {
        tt.ifError(err, 'call should not error');
        proc = proc[0];
        proc.startDebugger(function(err, status) {
          tt.ifError(err, 'call should not error');
          tt.deepEqual(status, {port: 12345});
          tt.end();
        });
      });
    });

    t.test('Start debugger CLI', function(tt) {
      exec.resetHome();
      exec(port, 'dbg-start 1', function(err, stdout) {
        tt.ifError(err, 'command should not error');
        tt.match(stdout, /Debugger listening on port \d+/);
        tt.end();
      });
    });

    t.test('Setup service manager (stop debugger)', function(tt) {
      function onCtlRequest(s, i, req, callback) {
        assert.equal(req.cmd, 'current');
        assert.equal(req.sub, 'dbg-stop');
        assert.equal(req.target, 1231);
        callback(null, {profile: 'some data'});
      }
      TestServiceManager.prototype.onCtlRequest = onCtlRequest;
      tt.end();
    });

    t.test('Stop debugger API', function(tt) {
      instance.processes({where: {pid: 1231}}, function(err, proc) {
        tt.ifError(err, 'call should not error');
        proc = proc[0];
        proc.stopDebugger(function(err /*, status*/) {
          tt.ifError(err, 'call should not error');
          tt.end();
        });
      });
    });

    t.test('Stop debugger CLI', function(tt) {
      exec.resetHome();
      exec(port, 'dbg-stop 1', function(err, stdout) {
        tt.ifError(err, 'command should not error');
        tt.match(stdout, /Debugger was disabled/);
        tt.end();
      });
    });
  });
});
