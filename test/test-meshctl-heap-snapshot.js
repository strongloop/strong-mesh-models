/* eslint max-nested-callbacks:0 */

var ServiceManager = require('../index').ServiceManager;
var assert = require('assert');
var exec = require('./exec-meshctl');
var test = require('tap').test;
var testCmdHelper = require('./meshctl-helper');
var util = require('util');

test('Test heap-snapshot commands', function(t) {
  function TestServiceManager() {
  }
  util.inherits(TestServiceManager, ServiceManager);

  testCmdHelper(t, TestServiceManager, function(t, service, instance, port) {
    t.test('Setup service manager (heap snapshot)', function(tt) {
      function onCtlRequest(s, i, req, callback) {
        assert.equal(req.cmd, 'current');
        assert.equal(req.sub, 'heap-snapshot');
        assert.equal(req.target, 1231);
        callback(null, {profile: 'some data'});
      }
      TestServiceManager.prototype.onCtlRequest = onCtlRequest;
      tt.end();
    });

    t.test('Stop snapshot API', function(tt) {
      instance.processes({where: {pid: 1231}}, function(err, proc) {
        tt.ifError(err, 'call should not error');
        proc = proc[0];
        proc.heapSnapshot(function(err, response) {
          tt.ifError(err, 'call should not error');
          tt.deepEqual(response, {
            url: '/api/Services/1/ProfileDatas/1/download', profileId: 1
          }, 'Response should match');
          tt.end();
        });
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
      function onCtlRequest(s, i, req, callback) {
        assert.equal(req.cmd, 'current');
        assert.equal(req.sub, 'heap-snapshot');
        assert.equal(req.target, 1232);
        callback(Error('something bad happened'));
      }
      TestServiceManager.prototype.onCtlRequest = onCtlRequest;
      tt.end();
    });

    t.test('Start snapshot API (error)', function(tt) {
      instance.processes({where: {pid: 1232}}, function(err, proc) {
        tt.ifError(err, 'call should not error');
        proc = proc[0];
        proc.heapSnapshot(function(err, response) {
          tt.ifError(err);
          service.profileDatas.findById(response.profileId,
            function(err, prof) {
              tt.ifError(err);
              tt.ok(prof.errored, 'Error bit should be set');
              tt.end();
            }
          );
        });
      });
    });

    t.test('Start snapshot CLI (error)', function(tt) {
      exec.resetHome();
      exec(port, 'heap-snapshot 2', function(err, stdout, stderr) {
        tt.ok(err, 'command should error');
        var patt = /Command "heap-snapshot" on "\S+" failed with Error:.+500/;
        tt.assert(patt.test(stderr), 'Rendered error should match');
        tt.end();
      });
    });
  });
});
