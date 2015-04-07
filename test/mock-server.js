var async = require('async');
var assert = require('assert');
var meshServer = require('../index').meshServer;
var ServiceManager = require('../index').ServiceManager;

var server = meshServer(new ServiceManager());
server.set('port', 8701);
server.start(function(err) {
  assert.ifError(err);
  var ServerService = server.models.ServerService;
  var Executor = server.models.Executor;
  var ServiceInstance = server.models.ServiceInstance;
  var ServiceProcess = server.models.ServiceProcess;

  var numServices = 50;
  var numExecutors = 5;
  var numProcesses = 5;

  var tasks = [];
  for(var s=1;s<=numServices;s++) {
    tasks.push(ServerService.create.bind(ServerService, {
      id: s,
      name: 'service ' + s,
      _groups: [{id: 1, name: 'group ' + s + ':1', scale: 1}],
    }));
  }

  for(var e=1;e<=numExecutors;e++) {
    tasks.push(Executor.create.bind(Executor, {
      id: e,
      address: '127.0.0.' + e,
      hostname: 'host-' + e + '.domain',
      APIPort: 5000 + e,
      totalCapacity: 2,
    }));
  }

  for(s=1;s<=numServices;s++) {
    for(e=1;e<=numExecutors;e++) {
      tasks.push(ServiceInstance.create.bind(ServiceInstance, {
        id: s+e,
        serverServiceId: s,
        groupId: 1,
        executorId: e,
        applicationName: 'test-app-' + s,
        containerVersionInfo: {
          container: {
            version: '1.2.3',
              apiVersion: '4.5.6',
          },
          node: '0.10',
        },
        PMPort: 8701,
        restartCount: 0,
        agentVersion: '7.8.9',
        setSize: 3,
      }));

      for(var p=1;p<=numProcesses;p++) {
        tasks.push(ServiceProcess.create.bind(ServiceProcess, {
          workerId: p,
          pid: e+1000+p,
          parentPid: e+1000,
          serviceInstanceId: s+e
        }));
      }
    }
  }

  async.series(tasks);
});
