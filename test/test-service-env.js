var Client = require('../index').Client;
var meshServer = require('../index').meshServer;
var ServiceManager = require('../index').ServiceManager;
var test = require('tap').test;

test('Service environment variable manipulation', function(t) {
  var manager = new ServiceManager();
  var server = meshServer(manager);
  server.set('port', 0);

  var client = null;
  var service = null;
  var Service = null;

  t.test('server & client setup', function(tt) {
    server.start(function onStart(err, port) {
      tt.ifError(err, 'server started successfully');
      client = new Client('http://127.0.0.1:' + port + '/api');
      Service = client.models.ServerService;
      tt.end();
    });
  });

  t.test('service creation', function(tt) {
    Service.create({name: 'test'}, function onCreate(err, newService) {
      service = newService;
      tt.ifError(err, 'service instance created successfully');
      tt.deepEqual(service.env, {}, 'Initial environment is empty');
      tt.end();
    });
  });

  t.test('setEnv sets a single environment variable', function(tt) {
    tt.deepEqual(service.env, {}, 'precondition');
    service.setEnv('FOO', 'BAR', function(err, res) {
      tt.ifError(err, 'setEnv (1) succeeded');
      tt.deepEqual(res, {FOO: 'BAR'}, 'setEnv tells us the new state');
      service.setEnv('ALSO', 'and then', function(err, res) {
        tt.ifError(err, 'setEnv (2) succeeded');
        tt.deepEqual(res, {ALSO: 'and then', FOO: 'BAR'}, 'multiple calls');
        tt.end();
      });
    });
  });

  t.test('setEnv change is persisted', function(tt) {
    Service.findOne(service.id, function onReload(err, updatedInstance) {
      tt.ifError(err, 'reload succeeded');
      service = updatedInstance;
      tt.deepEqual(service.env, {ALSO: 'and then', FOO: 'BAR'}, 'persisted');
      tt.end();
    });
  });

  t.test('unsetEnv deletes a single environment variable', function(tt) {
    tt.deepEqual(service.env, {ALSO: 'and then', FOO: 'BAR'}, 'precondition');
    service.unsetEnv('FOO', function(err, res) {
      tt.ifError(err, 'unsetEnv succeeded');
      tt.deepEqual(res, {ALSO: 'and then'}, 'Environment is updated');
      tt.end();
    });
  });

  t.test('setEnv change is persisted', function(tt) {
    Service.findOne(service.id, function onReload(err, updatedInstance) {
      tt.ifError(err, 'reload succeeded');
      service = updatedInstance;
      tt.deepEqual(service.env, {ALSO: 'and then'}, 'persisted');
      tt.end();
    });
  });

  t.test('client & server shutdown', function(tt) {
    server.stop();
    tt.end();
  });

  t.end();
});
