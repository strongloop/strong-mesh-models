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
    t.test('Setup service manager (start profiling)', function(tt) {
      function onCtlRequest(s, i, req, callback) {
        assert.deepEqual(req, {
          cmd: 'current', sub: 'start-cpu-profiling',
          stallout: 0,
          timeout: 0, target: 1231
        });
        callback(null, {});
      }
      TestServiceManager.prototype.onCtlRequest = onCtlRequest;
      tt.end();
    });

    t.test('Start profiling API', function(tt) {
      instance.processes({where: {pid: 1231}}, function(err, proc) {
        tt.ifError(err, 'call should not error');
        proc = proc[0];
        proc.startCpuProfiling({}, function(err, status) {
          tt.ifError(err, 'call should not error');
          tt.deepEqual(status, {
            url: '/api/Services/1/ProfileDatas/1/download', profileId: 1
          }, 'Response should match');
          tt.end();
        });
      });
    });

    t.test('Start profiling CLI', function(tt) {
      exec.resetHome();
      exec(port, 'cpu-start 1', function(err, stdout) {
        tt.ifError(err, 'command should not error');
        tt.equal(stdout, 'Profiler started, use cpu-stop to get profile\n',
          'Rendered status should match');
        tt.end();
      });
    });

    t.test('Setup service manager (watchdog)', function(tt) {
      function onCtlRequest(s, i, req, callback) {
        assert.deepEqual(req, {
          cmd: 'current', sub: 'start-cpu-profiling',
          stallout: 0,
          timeout: 10, target: 1232
        });
        callback(null, {});
      }
      TestServiceManager.prototype.onCtlRequest = onCtlRequest;
      tt.end();
    });

    t.test('Start profiling API (watchdog)', function(tt) {
      instance.processes({where: {pid: 1232}}, function(err, proc) {
        tt.ifError(err, 'call should not error');
        proc = proc[0];
        proc.startCpuProfiling({watchdogTimeout: 10}, function(err, status) {
          tt.ifError(err, 'call should not error');
          tt.deepEqual(status, {
            url: '/api/Services/1/ProfileDatas/2/download', profileId: 2
          }, 'Response should match');
          tt.end();
        });
      });
    });

    t.test('Start profiling CLI (watchdog)', function(tt) {
      exec.resetHome();
      exec(port, 'cpu-start 2 10', function(err, stdout) {
        tt.ifError(err, 'command should not error');
        tt.equal(stdout, 'Profiler started, use cpu-stop to get profile\n',
          'Rendered status should match');
        tt.end();
      });
    });

    t.test('Setup service manager (error)', function(tt) {
      function onCtlRequest(s, i, req, callback) {
        assert.deepEqual(req, {
          cmd: 'current', sub: 'start-cpu-profiling',
          stallout: 0,
          timeout: 0, target: 1233
        });
        callback(Error('something bad happened'));
      }
      TestServiceManager.prototype.onCtlRequest = onCtlRequest;
      tt.end();
    });

    t.test('Start profiling API (error)', function(tt) {
      instance.processes({where: {pid: 1233}}, function(err, proc) {
        tt.ifError(err, 'call should not error');
        proc = proc[0];
        proc.startCpuProfiling({}, function(err /*, status*/) {
          tt.ok(err, 'call should error');
          tt.end();
        });
      });
    });

    t.test('Start profiling CLI (error)', function(tt) {
      exec.resetHome();
      exec(port, 'cpu-start 3', function(err, stdout, stderr) {
        tt.ok(err, 'command should error');
        var patt = /Command "cpu-start" on "\S+" failed with Error: something/;
        tt.assert(patt.test(stderr), 'Rendered error should match');
        tt.end();
      });
    });

    t.test('Setup service manager (stop profiling)', function(tt) {
      function onCtlRequest(s, i, req, callback) {
        assert.equal(req.cmd, 'current');
        assert.equal(req.sub, 'stop-cpu-profiling');
        assert.equal(req.target, 1231);
        callback(null, {profile: 'some data'});
      }
      TestServiceManager.prototype.onCtlRequest = onCtlRequest;
      tt.end();
    });

    t.test('Stop profiling API', function(tt) {
      instance.processes({where: {pid: 1231}}, function(err, proc) {
        tt.ifError(err, 'call should not error');
        proc = proc[0];
        proc.stopCpuProfiling(function(err, status) {
          tt.ifError(err, 'call should not error');
          tt.deepEqual(status, {
            url: '/api/Services/1/ProfileDatas/1/download', profileId: 1
          }, 'Response should match');
          tt.end();
        });
      });
    });

    t.test('Stop profiling CLI', function(tt) {
      exec.resetHome();
      exec(port, 'cpu-stop 1', function(err, stdout) {
        tt.ifError(err, 'command should not error');
        tt.equal(stdout, 'CPU profile written to `node.1.cpuprofile`, ' +
          'load into Chrome Dev Tools\n',
          'Rendered status should match');
        tt.end();
      });
    });
  });
});
