var ServiceManager = require('../index').ServiceManager;
var assert = require('assert');
var exec = require('./exec-meshctl');
var fs = require('fs');
var test = require('tap').test;
var testCmdHelper = require('./meshctl-helper');
var util = require('util');

test('Test heap-snapshot commands', function(t) {
  function TestServiceManager() {
  }
  util.inherits(TestServiceManager, ServiceManager);

  testCmdHelper(t, TestServiceManager, function(t, service, instance, port) {
    t.test('Setup service manager (heap snapshot)', function(tt) {
      function ctlRequest(s, i, req, callback) {
        assert.equal(req.cmd, 'current');
        assert.equal(req.sub, 'heap-snapshot');
        assert.equal(req.target, 1);
        assert.ok(req.filePath);
        fs.writeFileSync(req.filePath, 'some data');
        callback(null, {});
      }
      TestServiceManager.prototype.ctlRequest = ctlRequest;
      tt.end();
    });

    t.test('Stop snapshot API', function(tt) {
      instance.heapSnapshot(1, function(err, response) {
        tt.ifError(err, 'call should not error');
        tt.deepEqual(response, {
          url: '/api/Services/1/ProfileDatas/1/download',
          profileId: 1
        }, 'Response should match');
        tt.end();
      });
    });

    t.test('Stop snapshot CLI', function(tt) {
      exec.resetHome();
      exec(port, 'heap-snapshot 1', function(err, stdout) {
        tt.ifError(err, 'command should not error');
        tt.equal(stdout, 'Heap snapshot written to `node.1.heapsnapshot`, ' +
          'load into Chrome Dev Tools\n',
          'Rendered output should match');
        tt.end();
      });
    });

    t.test('Setup service manager (error)', function(tt) {
      function ctlRequest(s, i, req, callback) {
        assert.equal(req.cmd, 'current');
        assert.equal(req.sub, 'heap-snapshot');
        assert.equal(req.target, 3);
        callback(Error('something bad happened'));
      }
      TestServiceManager.prototype.ctlRequest = ctlRequest;
      tt.end();
    });

    t.test('Start snapshot API (error)', function(tt) {
      instance.heapSnapshot(3,
        function(err, response) {
          tt.ifError(err);
          service.profileDatas.findById(response.profileId,
            function(err, prof) {
              tt.ifError(err);
              tt.ok(prof.errored, 'Error bit should be set');
              tt.end();
            }
          );
        }
      );
    });

    t.test('Start snapshot CLI (error)', function(tt) {
      exec.resetHome();
      exec(port, 'heap-snapshot 3', function(err, stdout, stderr) {
        tt.ok(err, 'command should error');
        tt.equal(stderr,
          'Command heap-snapshot failed with Error: ' +
          'code 500/Profiling failed: Error: something bad happened\n',
          'Rendered error should match');
        tt.end();
      });
    });
  });
});
