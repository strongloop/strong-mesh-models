/* eslint max-nested-callbacks:0 */
var test = require('tap').test;
var util = require('util');
var fs = require('fs');
var testCmdHelper = require('./meshctl-helper');
var ServiceManager = require('../index').ServiceManager;

test('Check heap and cpu profiling populates Profile models', function(t) {
    function TestServiceManager() {
      ServiceManager.apply(this, arguments);
    }
    util.inherits(TestServiceManager, ServiceManager);

    function onCtlRequest(service, instance, req, callback) {
      t.equal(service.id, 1, 'request: Service id should match');
      t.equal(instance.id, 1, 'request: Instance id should match');
      callback(null, {response: 'ok', profile: 'PROFILE'});
    }
    TestServiceManager.prototype.onCtlRequest = onCtlRequest;

    testCmdHelper(t, TestServiceManager, function(t, service, instance) {
      t.test('heap snapshot', function(tt) {
        instance.processes({where: {id: 1}}, function(err, processes) {
          tt.ifError(err, 'process lookup should succeed');
          tt.equal(processes.length, 1, 'one process should be found');

          var process = processes[0];

          if (!process)
            return tt.end();

          process.heapSnapshot(function(err, res) {
            tt.ifError(err, 'Command should not return error');
            tt.ok(res.profileId, 'Profile ID should be available');
            service.profileDatas.findById(res.profileId, function(err, p) {
              tt.ok(!err, 'Profile lookup should not return error');
              tt.ok(p, 'Profile object should exist');
              fs.writeFileSync(p.fileName, 'test heapsnapshot');
              instance.downloadProfile(p.id, function(err, res) {
                tt.ok(!err, 'Profile download should not error');
                res.setEncoding('utf8');
                res.on('data', function(s) {
                  tt.equal(s, 'test heapsnapshot', 'Snapshot should match');
                  tt.end();
                });
              });
            });
          });
        });
      });

      t.test('cpu stop', function(tt) {
        instance.processes({where: {id: 1}}, function(err, processes) {
          tt.ifError(err, 'process lookup should succeed');
          tt.equal(processes.length, 1, 'one process should be found');

          var process = processes[0];

          if (!process)
            return tt.end();

          process.stopCpuProfiling(function(err, res) {
            tt.ok(!err, 'Command should not return error');
            tt.ok(res.profileId, 'Profile ID should be available');
            service.profileDatas.findById(res.profileId, function(err, p) {
              tt.ok(!err, 'Profile lookup should not return error');
              tt.ok(p, 'Profile object should exist');
              tt.end();
            });
          });
        });
      });
    });
  }
);
