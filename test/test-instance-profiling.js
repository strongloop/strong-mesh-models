var test = require('tap').test;
var util = require('util');
var async = require('async');
var fs = require('fs');
var meshServer = require('../index').meshServer;
var ServiceManager = require('../index').ServiceManager;
var Client = require('../index').Client;

test('Check that heap-snapshot and cpu-profileing populates Profile models',
  function(t) {
    function TestServiceManager() {
      ServiceManager.apply(this, arguments);
    }
    util.inherits(TestServiceManager, ServiceManager);

    function onServiceUpdate(service, callback) {
      t.equal(service.name, 'My Service', 'create: Service name should match');
      t.equal(service._groups.length, 1, 'create: Service should have 1 group');
      t.equal(service._groups[0].scale, 1, 'create: Group scale should be 1');

      var app = service.constructor.app;
      var ServiceInstance = app.models.ServiceInstance;
      var Executor = app.models.Executor;
      Executor.create({
        address: '127.0.0.1',
        APIPort: 5000,
        totalCapacity: 2,
      }, function(err, executor) {
        t.ok(!err, 'Executor should be created');

        ServiceInstance.create({
          serverServiceId: service.id,
          groupId: service._groups[0].id,
          executorId: executor.id,
        }, callback);
      });
    }
    TestServiceManager.prototype.onServiceUpdate = onServiceUpdate;

    function ctlRequest(service, instance, req, callback) {
      t.equal(service.id, 1, 'request: Service id should match');
      t.equal(instance.id, 1, 'request: Instance id should match');
      callback(null, {response: 'ok'});
    }
    TestServiceManager.prototype.ctlRequest = ctlRequest;

    t.plan(23);
    var server = meshServer(new TestServiceManager());
    server.set('port', 0);
    server.start(function(err, port) {
      t.ok(!err, 'Server should start');

      var baseUrl = 'http://127.0.0.1:' + port;
      var client = new Client(baseUrl + '/api');
      client.serviceCreate('My Service', 1, function(err, service) {
        t.ok(!err, 'Create service should succeed');
        client.instanceList('My Service', function(err, instances) {
          t.ok(!err, 'Instance list should succeed');
          t.equal(instances.length, 1, 'Service should have 1 instance');
          var inst = instances[0];

          async.series([
            runHeapSnapshot.bind(null, t, client, service, inst, baseUrl),
            stopCpuProfiling.bind(null, t, client, service, inst, baseUrl)
          ],
            function(err) {
              t.ok(!err, 'Commands should not error');
              server.stop();
            });
        });
      });
    });
  });

function runHeapSnapshot(t, client, service, instance, baseUrl, callback) {
  instance.runCommand({
    cmd: 'current',
    sub: 'heap-snapshot',
    target: 1
  }, function(err, res) {
    t.ok(!err, 'Command should not return error');
    t.ok(res.profileId, 'Profile ID should be available');
    service.profileDatas.findById(res.profileId, function(err, p) {
      t.ok(!err, 'Profile lookup should not return error');
      t.ok(p, 'Profile object should exist');
      fs.writeFileSync(p.fileName, 'test heapsnapshot');
      instance.downloadProfile(p.id, function(err, res) {
        t.ok(!err, 'Profile download should not error');
        res.setEncoding('utf8');
        res.on('data', function(s) {
          t.equal(s, 'test heapsnapshot', 'Snapshot should match');
          callback();
        });
      });
    });
  });
}

function stopCpuProfiling(t, client, service, instance, baseUrl, callback) {
  instance.runCommand({
    cmd: 'current',
    sub: 'stop-cpu-profiling',
    target: 1
  }, function(err, res) {
    t.ok(!err, 'Command should not return error');
    t.ok(res.profileId, 'Profile ID should be available');
    service.profileDatas.findById(res.profileId, function(err, p) {
      t.ok(!err, 'Profile lookup should not return error');
      t.ok(p, 'Profile object should exist');
      callback();
    });
  });
}
