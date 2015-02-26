var test = require('tap').test;
var util = require('util');
var Server = require('../index').Server;
var ServiceManager = require('../index').ServiceManager;
var Client = require('../index').Client;

test('Create and destroy a service', function(t) {
  function TestServiceManager() {
    ServiceManager.apply(this, arguments);
  }
  util.inherits(TestServiceManager, ServiceManager);

  function onServiceUpdate(service, callback) {
    t.equal(service.name, 'My Service', 'create: Service name should match');
    t.equal(service._groups.length, 1, 'create: Service should have 1 group');
    t.equal(service._groups[0].scale, 2, 'create: Group scale should be 2');
    callback();
  }
  TestServiceManager.prototype.onServiceUpdate = onServiceUpdate;

  function onDeployment(service, req, res) {
    req.setEncoding('utf8');
    t.ok(req, 'deploy: Deployment request received');
    t.equal(req.read(), 'some data', 'deploy: Deployment data should match');
    t.equal(req.headers['content-type'], 'application/some-type');
    res.end('ok. ServiceID: ' + service.id);
  }
  TestServiceManager.prototype.onDeployment = onDeployment;

  function getDeployment(service, req, res) {
    t.ok(req, 'Pack download request received');
    res.end('Data. ServiceID: ' + service.id);
  }
  TestServiceManager.prototype.getDeployment = getDeployment;

  t.plan(16);
  var server = new Server(new TestServiceManager());
  server.start(function(err, port) {
    t.ok(!err, 'Server should start');

    var client = new Client('http://127.0.0.1:' + port + '/api');
    client.serviceCreate('My Service', 2, function(err, service) {
      t.ok(!err, 'Create service should succeed');
      t.equal(service.name, 'My Service', 'Service name should match');
      t.equal(service._groups.length, 1, 'Service should have 1 group');
      t.equal(service._groups[0].scale, 2, 'Group scale should be 2');
      var req = client.serviceDeploy(
        service,
        'application/some-type',
        function(err, res) {
          t.ok(!err, 'Deploy should not error');
          var responseBody = 'ok. ServiceID: ' + service.id;
          t.equal(res.body, responseBody, 'deploy: Response should match');

          client.serviceGetArtifact(service, function(err, res) {
            t.ok(!err, 'download: Deployment download should succeed');
            var expected = 'Data. ServiceID: ' + service.id;
            t.equal(res.body, expected, 'download: Download body should match');
            server.stop();
          });
        }
      );

      req.write('some data');
    });
  });
});
