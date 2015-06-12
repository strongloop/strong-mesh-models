var Client = require('../index').Client;
var ServiceManager = require('../index').ServiceManager;
var concat = require('concat-stream');
var meshServer = require('../index').meshServer;
var test = require('tap').test;
var util = require('util');

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

  function onDeployment(service, req, res) {
    req.setEncoding('utf8');
    t.ok(req, 'deploy: Deployment request received');
    t.equal(req.read(), 'some data', 'deploy: Deployment data should match');
    t.equal(req.headers['content-type'], 'application/some-type');
    res.end('ok. ServiceID: ' + service.id);
  }
  TestServiceManager.prototype.onDeployment = onDeployment;

  var server = meshServer(new TestServiceManager());
  var client = null;
  var service = null;

  t.test('start server', function(tt) {
    server.set('port', 0);
    server.start(function(err, port) {
      tt.ifError(err);
      client = new Client('http://127.0.0.1:' + port + '/api');
      tt.end();
    });
  });

  t.test('initialize models', function(tt) {
    client.serviceCreate('My Service', 2, function(err, s) {
      tt.ifError(err);
      tt.equal(s.name, 'My Service', 'Service name should match');
      tt.equal(s._groups.length, 1, 'Service should have 1 group');
      tt.equal(s._groups[0].scale, 2, 'Group scale should be 2');
      service = s;
      tt.end();
    });
  });

  t.test('deploy a service', function(tt) {
    var req = service.deploy('application/some-type', function(err, res) {
      tt.ifError(err);
      var expResponseBody = 'ok. ServiceID: ' + service.id;
      res.setEncoding('utf8');
      res.on('error', t.ifError.bind(t));
      res.pipe(concat(function(responseBody) {
        tt.equal(responseBody,
          expResponseBody,
          'deploy: Response should match');
        server.stop();
        tt.end();
      }));
    });
    req.write('some data');
  });

  server.on('stopped', function() {
    t.end();
  });
});
