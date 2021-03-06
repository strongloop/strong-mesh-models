// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: strong-mesh-models
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

'use strict';

/* eslint max-nested-callbacks:0 */

var debug = require('debug')('strong-mesh-models:test');
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

  function assertCtlRequests(t, serviceId, instanceId) {
    return onCtlRequest;
    function onCtlRequest(service, instance, req, callback) {
      t.equal(service.id, serviceId, 'request: Service id should match');
      t.equal(instance.id, instanceId, 'request: Instance id should match');
      callback(null, {response: 'ok', profile: 'PROFILE'});
    }
  }
  function noopCtlRequest(s, i, r, callback) {
    callback(null, {response: 'ok', profile: 'PROFILE'});
  }

  testCmdHelper(t, TestServiceManager, function(t, service, instance) {
    t.test('heap snapshot download', function(tt) {
      TestServiceManager.prototype.onCtlRequest = assertCtlRequests(tt, 1, 1);
      instance.processes({where: {id: 1}}, function(err, processes) {
        tt.ifError(err, 'process lookup should succeed');
        tt.equal(processes.length, 1, 'one process should be found');

        var process = processes[0];
        instance.heapSnapshot(process.id, function(err, res) {
          tt.ifError(err, 'Command should not return error');
          tt.ok(res.profileId, 'Profile ID should be available');
          service.profileDatas.findById(res.profileId, function(err, p) {
            tt.ifError(err, 'Profile lookup should not return error');
            tt.ok(p, 'Profile object should exist');
            instance.downloadProfile(p.id, function(err, res) {
              tt.ok(!err, 'Profile download should not error');
              res.setEncoding('utf8');
              res.on('data', function(s) {
                tt.equal(s, 'PROFILE', 'Snapshot should match');
                tt.end();
              });
            });
          });
        });
      });
    });

    t.test('heap snapshot delete', function(tt) {
      TestServiceManager.prototype.onCtlRequest = assertCtlRequests(tt, 1, 1);
      instance.heapSnapshot(1, function(err, res) {
        tt.ifError(err);

        function testProfile() {
          service.profileDatas.findById(res.profileId, function(err, p) {
            // After starting heap snapshot, need to wait a few ticks to ensure
            // that agent has enough time to dump the snapshot to file.
            if (!err && !p.completed) return setImmediate(testProfile);
            tt.ifError(err);
            fs.readFile(p.fileName, 'utf-8', function(err, data) {
              tt.ifError(err);
              tt.equal(data, 'PROFILE');

              service.profileDatas.deleteById(p.id, function(err) {
                tt.ifError(err);
                fs.readFile(p.fileName, function(err) {
                  debug('%j should be deleted: %s', p.fileName, err);
                  tt.ok(err);
                  tt.end();
                });
              });
            });
          });
        }

        testProfile();
      });
    });

    t.test('cpu stop', function(tt) {
      TestServiceManager.prototype.onCtlRequest = assertCtlRequests(tt, 1, 1);
      instance.processes({where: {id: 1}}, function(err, processes) {
        tt.ifError(err, 'process lookup should succeed');
        tt.equal(processes.length, 1, 'one process should be found');

        var process = processes[0];

        if (!process)
          return tt.end();

        instance.stopCpuProfiling(process.id, function(err, res) {
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

    t.test('teardown', function(tt) {
      TestServiceManager.prototype.onCtlRequest = noopCtlRequest;
      tt.pass('disabling test req handler');
      tt.end();
    });

    t.end();
  });
});
