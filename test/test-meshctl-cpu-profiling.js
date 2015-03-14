var ServiceManager = require('../index').ServiceManager;
var assert = require('assert');
var exec = require('./exec-meshctl');
var fs = require('fs');
var test = require('tap').test;
var testCmdHelper = require('./meshctl-helper');
var util = require('util');

test('Test cpu-profiling commands', function(t) {
  function TestServiceManager() {
  }
  util.inherits(TestServiceManager, ServiceManager);

  testCmdHelper(t, TestServiceManager, function(t, service, instance, port) {
    t.test('Setup service manager (start profiling)', function(tt) {
      function ctlRequest(s, i, req, callback) {
        assert.deepEqual(req,
          {cmd: 'current', sub: 'start-cpu-profiling', timeout: 0, target: 1});
        callback(null, {});
      }
      TestServiceManager.prototype.ctlRequest = ctlRequest;
      tt.end();
    });

    t.test('Start profiling API', function(tt) {
      instance.cpuProfilingStart(1, 0, function(err, status) {
        tt.ifError(err, 'call should not error');
        tt.deepEqual(status, {}, 'Response should match');
        tt.end();
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
      function ctlRequest(s, i, req, callback) {
        assert.deepEqual(req,
          {cmd: 'current', sub: 'start-cpu-profiling', timeout: 10, target: 2});
        callback(null, {});
      }
      TestServiceManager.prototype.ctlRequest = ctlRequest;
      tt.end();
    });

    t.test('Start profiling API (watchdog)', function(tt) {
      instance.cpuProfilingStart(2, {watchdogTimeout: 10},
        function(err, status) {
          tt.ifError(err, 'call should not error');
          tt.deepEqual(status, {}, 'Response should match');
          tt.end();
        }
      );
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
      function ctlRequest(s, i, req, callback) {
        assert.deepEqual(req,
          {cmd: 'current', sub: 'start-cpu-profiling', timeout: 0, target: 3});
        callback(Error('something bad happened'));
      }
      TestServiceManager.prototype.ctlRequest = ctlRequest;
      tt.end();
    });

    t.test('Start profiling API (error)', function(tt) {
      instance.cpuProfilingStart(3, {},
        function(err /*, status*/) {
          tt.ok(err, 'call should error');
          tt.end();
        }
      );
    });

    t.test('Start profiling CLI (error)', function(tt) {
      exec.resetHome();
      exec(port, 'cpu-start 3', function(err, stdout, stderr) {
        tt.ok(err, 'command should error');
        tt.equal(stderr,
          'Command cpu-start failed with Error: something bad happened\n',
          'Rendered error should match');
        tt.end();
      });
    });

    t.test('Setup service manager (stop profiling)', function(tt) {
      function ctlRequest(s, i, req, callback) {
        assert.equal(req.cmd, 'current');
        assert.equal(req.sub, 'stop-cpu-profiling');
        assert.equal(req.target, 1);
        assert.ok(req.filePath);
        fs.writeFileSync(req.filePath, 'some data');
        callback(null, {});
      }
      TestServiceManager.prototype.ctlRequest = ctlRequest;
      tt.end();
    });

    t.test('Stop profiling API', function(tt) {
      instance.cpuProfilingStop(1, function(err, status) {
        tt.ifError(err, 'call should not error');
        tt.deepEqual(status, {
          url: '/api/Services/1/ProfileDatas/1/download',
          profileId: 1
        }, 'Response should match');
        tt.end();
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
