var async = require('async');
var meshServer = require('../index').meshServer;
var Client = require('../index').Client;

function testCmdHelper(t, TestServiceManager, test) {
  var server = meshServer(new TestServiceManager());
  server.set('port', 0);
  server.start(function(err, port) {
    t.ifError(err, 'server should start. port: ' + port || -1);

    t.test('Setup base models', function(tt) {
      var service = {
        name: 'service 1', _groups: [{id: 1, name: 'group 1', scale: 1}]
      };
      var exec = {
        address: '127.0.0.1', APIPort: 5000, totalCapacity: 2,
      };
      var inst = {
        serverServiceId: 1, groupId: 1, executorId: 1,
      };

      var ServerService = server.models.ServerService;
      var ServiceInstance = server.models.ServiceInstance;
      var Executor = server.models.Executor;
      async.series([
        ServerService.create.bind(ServerService, service),
        Executor.create.bind(Executor, exec),
        ServiceInstance.create.bind(ServiceInstance, inst),
      ],
        function(err) {
          tt.ifError(err, 'base models should be created');
          tt.end();
        });
    });

    t.test('Initialize client models', function(tt) {
      var client = new Client('http://127.0.0.1:' + port);
      client.serviceFind('1', function(err, service) {
        tt.ifError(err, 'Default service should be found');
        service.instances.findById('1', function(err, instance) {
          tt.ifError(err, 'Default instance should be found');

          test(tt, service, instance, port);
          tt.end();
        });
      });
    });

    t.test('Cleanup', function(tt) {
      server.stop(tt.end.bind(tt));
    });
    t.end();
  });
}

module.exports = testCmdHelper;
