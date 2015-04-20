var async = require('async');
var assert = require('assert');
var meshServer = require('../index').meshServer;
var ServiceManager = require('../index').ServiceManager;

var server = meshServer(new ServiceManager());
server.set('port', 8701);

function genExpressMetrics(cb) {
  var updates = [];

  var oneDay = 24 * 60 * 60 * 1000;
  server.set('ExpressUsageRecord.deleteWindow', String(oneDay));
  var endpoints = [{
    url: '/api/ModelA/1',
    model: 'ModelA',
    id: 1,
    remoteMethod: null,
    method: 'GET'
  }, {
    url: '/api/ModelB/2',
    model: 'ModelB',
    id: 1,
    remoteMethod: null,
    method: 'GET'
  }, {
    url: '/api/ModelA/1',
    model: 'ModelA',
    id: 1,
    remoteMethod: null,
    method: 'PUT'
  }, {
    url: '/api/ModelA/1',
    model: 'ModelA',
    id: 1,
    remoteMethod: null,
    method: 'POST'
  }, {
    url: '/api/ModelC/methodF',
    model: 'ModelC',
    id: 1,
    remoteMethod: 'methodF',
    method: 'POST'
  }, {
    url: '/api/ModelD/1',
    model: 'ModelA',
    id: 1,
    remoteMethod: null,
    method: 'POST'
  }, {
    url: '/api/ModelA/1',
    model: 'ModelA',
    id: 1,
    remoteMethod: null,
    method: 'DELETE'
  }, {
    url: '/api/endpoint1/some/url',
    model: null,
    id: null,
    remoteMethod: null,
    method: 'POST'
  }];

  var dataStartTime = new Date(new Date() - 23 * 60 * 60 * 1000);
  console.log('Data starts at %s', dataStartTime.toString());

  for (var i = 0; i < 500; i++) {
    var status = Math.random() >= 0.5 ? 200 : 404;
    var d = new Date();
    d -= (Math.random() * 23 * 60 * 60 * 1000);
    var m = endpoints[Math.floor(Math.random() * endpoints.length)];

    updates.push({
      'timestamp': Number(d),
      'client': {
        'address': '127.0.0.' + Math.round(Math.random() * 7),
        'id': Math.round((Math.random() * 100)),
        'username': 'a@bcom'
      },
      'request': {
        'method': m.method,
        'url': m.url
      },
      'response': {
        'status': status,
        'duration': Math.round((Math.random() * 100)),
        'bytes': null
      },
      'process': {
        'pid': 1002
      },
      'data': {
        'status': status,
        'url': m.url
      },
      'loopback': {
        modelName: m.model,
        instanceId: m.id,
        remoteMethod: m.remoteMethod
      }
    });
  }

  async.each(updates, function(data, callback) {
    var uInfo = {
      cmd: 'express:usage-record',
      record: data,
    };

    server.handleModelUpdate(2, uInfo, callback);
  }, cb);
}

server.start(function(err) {
  assert.ifError(err);
  var ServerService = server.models.ServerService;
  var Executor = server.models.Executor;
  var ServiceInstance = server.models.ServiceInstance;
  var ServiceProcess = server.models.ServiceProcess;

  var tasks = [];
  tasks.push(ServerService.create.bind(ServerService, {
    id: 1,
    name: 'service 1',
    _groups: [{id: 1, name: 'group 1:1', scale: 1}]
  }));

  tasks.push(Executor.create.bind(Executor, {
    id: 1,
    address: '127.0.0.1',
    hostname: 'host-1.domain',
    APIPort: 5001,
    totalCapacity: 2
  }));

  tasks.push(ServiceInstance.create.bind(ServiceInstance, {
    id: 2,
    serverServiceId: 1,
    groupId: 1,
    executorId: 1,
    applicationName: 'test-app-1',
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

  for (var p = 1; p <= 3; p += 1) {
    tasks.push(ServiceProcess.create.bind(ServiceProcess, {
      workerId: p,
      pid: 1001 + p,
      parentPid: 1001,
      serviceInstanceId: 2
    }));
  }

  tasks.push(genExpressMetrics.bind(null));
  async.series(tasks);
});
