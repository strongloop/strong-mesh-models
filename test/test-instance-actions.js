var test = require('tap').test;
var util = require('util');
var meshServer = require('../index').meshServer;
var ServiceManager = require('../index').ServiceManager;
var Client = require('../index').Client;

test('Create and destroy instances', function(t) {
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
    ServiceInstance.create({
      serverServiceId: service.id,
      groupId: service._groups[0].id,
    }, callback);
  }
  TestServiceManager.prototype.onServiceUpdate = onServiceUpdate;

  function ctlRequest(service, instance, req, callback) {
    t.equal(service.id, 1, 'request: Service id should match');
    t.equal(instance.id, 1, 'request: Instance id should match');
    t.deepEqual(req, {cmd: 'my request'}, 'request: request sould match');
    callback(null, {response: 'ok'});
  }
  TestServiceManager.prototype.ctlRequest = ctlRequest;

  t.plan(15);
  var server = meshServer(new TestServiceManager());
  server.set('port', 0);
  server.start(function(err, port) {
    t.ok(!err, 'Server should start');

    var client = new Client('http://127.0.0.1:' + port + '/api');
    client.serviceCreate('My Service', 1, function(err, service) {
      t.ok(!err, 'Create service should succeed');
      t.equal(service.name, 'My Service', 'Service name should match');
      t.equal(service._groups.length, 1, 'Service should have 1 group');
      t.equal(service._groups[0].scale, 1, 'Group scale should be 1');

      client.instanceList('My Service', function(err, instances) {
        t.ok(!err, 'Instance list should succeed');
        t.equal(instances.length, 1, 'Service should have 1 instance');
        var instance = instances[0];
        instance.runCommand(
          {cmd: 'my request'},
          function(err, res) {
            t.ok(!err, 'Request should succeed');
            t.deepEqual(res, {response: 'ok'}, 'Response should match');
            server.stop();
          }
        );
      });
    });
  });
});
