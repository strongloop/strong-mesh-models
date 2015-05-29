var async = require('async');
var meshServer = require('../index').meshServer;
var Client = require('../index').Client;

function testCmdHelper(t, TestServiceManager, test, MockMinkelite) {
  var server = null;
  if (MockMinkelite) {
    server = meshServer(new TestServiceManager(), new MockMinkelite(), {});
  } else {
    server = meshServer(new TestServiceManager());
  }

  server.set('port', 0);
  server.start(function(err, port) {
    t.ifError(err, 'server should start. port: ' + port || -1);

    t.test('Setup base models', function(tt) {
      var service = {
        id: 1,
        name: 'service 1',
        _groups: [{id: 1, name: 'group 1', scale: 1}],
      };

      var exec = {
        id: 1,
        address: '127.0.0.1',
        hostname: 'mockhost.mockdomain',
        APIPort: 5000,
        totalCapacity: 2,
      };

      var inst = {
        id: 1,
        serverServiceId: 1,
        groupId: 1,
        executorId: 1,
        applicationName: 'test-app',
        containerVersionInfo: {
          container: {
            version: '1.2.3',
            apiVersion: '4.5.6',
          },
          node: '0.10',
          driverMeta: {},
        },
        PMPort: 8701,
        restartCount: 0,
        agentVersion: '7.8.9',
        setSize: 3,
      };

      var proc0 = {
        workerId: 0,
        pid: 1230,
        parentPid: 1229,
        serviceInstanceId: 1,
      };

      var proc1 = {
        workerId: 1,
        pid: 1231,
        parentPid: 1230,
        serviceInstanceId: 1,
        listeningSockets: [
          {address: '0.0.0.0', port: 4321},
          'some-socket',
        ],
      };

      var proc2 = {
        workerId: 2,
        pid: 1232,
        parentPid: 1230,
        serviceInstanceId: 1,
        // null address should display as '0.0.0.0'
        listeningSockets: [{address: null, port: 4321}],
      };

      var proc3 = {
        workerId: 3,
        pid: 1233,
        parentPid: 1230,
        serviceInstanceId: 1,
        listeningSockets: [{address: '0.0.0.0', port: 4321}],
      };

      var ServerService = server.models.ServerService;
      var ServiceInstance = server.models.ServiceInstance;
      var Executor = server.models.Executor;
      var ServiceProcess = server.models.ServiceProcess;
      async.series([
        ServerService.create.bind(ServerService, service),
        Executor.create.bind(Executor, exec),
        ServiceInstance.create.bind(ServiceInstance, inst),
        ServiceProcess.create.bind(ServiceProcess, proc0),
        ServiceProcess.create.bind(ServiceProcess, proc1),
        ServiceProcess.create.bind(ServiceProcess, proc2),
        ServiceProcess.create.bind(ServiceProcess, proc3),
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

          test(tt, service, instance, port, server);
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
