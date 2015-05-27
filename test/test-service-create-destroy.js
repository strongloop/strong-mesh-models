var test = require('tap').test;
var util = require('util');
var meshServer = require('../index').meshServer;
var ServiceManager = require('../index').ServiceManager;
var Client = require('../index').Client;

test('Create and destroy a service', function(t) {
  function TestServiceManager() {
    ServiceManager.apply(this, arguments);
  }
  util.inherits(TestServiceManager, ServiceManager);

  function onServiceUpdate(service, isNew, callback) {
    t.equal(service.name, 'My Service', 'create: Service name should match');
    t.equal(service._groups.length, 1, 'create: Service should have 1 group');
    t.equal(service._groups[0].scale, 2, 'create: Group scale should be 2');
    callback();
  }
  TestServiceManager.prototype.onServiceUpdate = onServiceUpdate;

  function onServiceDestroy(service, callback) {
    t.equal(service.name, 'My Service', 'destroy: Service name should match');
    t.equal(service._groups.length, 1, 'destroy: Service should have 1 group');
    t.equal(service._groups[0].scale, 2, 'destroy: Group scale should be 2');
    callback();
  }
  TestServiceManager.prototype.onServiceDestroy = onServiceDestroy;

  t.plan(13);
  var server = meshServer(new TestServiceManager());
  server.set('port', 0);
  server.start(function(err, port) {
    t.ok(!err, 'Server should start');

    var client = new Client('http://127.0.0.1:' + port + '/api');
    client.serviceCreate('My Service', 2, function(err, service) {
      t.ok(!err, 'Create service should succeed');
      t.equal(service.name, 'My Service', 'Service name should match');
      t.equal(service._groups.length, 1, 'Service should have 1 group');
      t.equal(service._groups[0].scale, 2, 'Group scale should be 2');
      t.deepEqual(service.env, {}, 'Environment is empty by default');
      client.serviceDestroy('My Service', function(err) {
        t.ok(!err, 'Service should be destroyed');
        server.stop();
      });
    });
  });
});
