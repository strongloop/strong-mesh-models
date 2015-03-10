var async = require('async');
var exec = require('./exec-meshctl');
var test = require('tap').test;
var util = require('util');
var meshServer = require('../index').meshServer;
var ServiceManager = require('../index').ServiceManager;
var Client = require('../index').Client;

test('Test actions', function(t) {
  function TestServiceManager() {
  }
  util.inherits(TestServiceManager, ServiceManager);

  var BASE = '/strongloop/strong-pm/.strong-pm';
  var STATUS = {
    pid: 90422,
    port: 8701,
    cwd: BASE,
    base: BASE,
    current: {
      pwd: BASE + '/work/current',
      cwd: BASE + '/work/462df261bc2a8df5455289a801f91ad7a95e8bb0',
      config: {
        prepare: ['npm rebuild', 'npm install --production'],
        start: ['sl-run --cluster=CPU'],
        stop: ['SIGTERM'],
        replace: ['SIGHUP'],
        files: {}
      },
      pid: 90423,
      workers: [{
        id: '1',
        pid: 90424,
        uptime: 4915
      }]
    }
  };

  var RENDERED_STATUS = [
    'manager:',
    '  pid:                90422',
    '  port:               8701',
    '  base:               /strongloop/strong-pm/.strong-pm',
    '  config:             undefined',
    'current:',
    '  status:             started',
    '  pid:                90423',
    '  link:               /strongloop/strong-pm/.strong-pm/work/current',
    '  current:            462df261bc2a8df5455289a801f91ad7a95e8bb0',
    '  worker count:       1',
    '    [1]:              cluster id 1, pid 90424',
    ''
  ].join('\n');

  var server = meshServer(new TestServiceManager());
  server.set('port', 0);
  server.start(function(err, port) {
    t.ifError(err);

    t.test('Setup base models', function(tt) {
      var service = {
        name: 'service 1',
        _groups: [{id: 1, name: 'group 1', scale: 1}]
      };
      var exec = {
        address: '127.0.0.1',
        APIPort: 5000,
        totalCapacity: 2,
      };
      var inst = {
        serverServiceId: 1,
        groupId: 1,
        executorId: 1,
      };

      var ServerService = server.models.ServerService;
      var ServiceInstance = server.models.ServiceInstance;
      var Executor = server.models.Executor;
      async.series([
        ServerService.create.bind(ServerService, service),
        Executor.create.bind(Executor, exec),
        ServiceInstance.create.bind(ServiceInstance, inst),
      ], function(err) {
        tt.ifError(err);
        tt.end();
      });
    });

    var instance = null;

    t.test('Initialize client models', function(tt) {
      function ctlRequest(service, instance, req, callback) {
        tt.deepEqual(req, {cmd: 'status'}, 'Request should match');
        callback(null, STATUS);
      }
      TestServiceManager.prototype.ctlRequest = ctlRequest;

      var client = new Client('http://127.0.0.1:' + port);
      client.serviceFind('1', function(err, s) {
        tt.ifError(err, 'Default service should be found');
        s.instances.findById('1', function(err, i) {
          tt.ifError(err, 'Default instance should be found');
          instance = i;
          tt.end();
        });
      });
    });

    t.test('Status summary API', function(tt) {
      instance.statusSummary(function(err, status) {
        tt.ifError(err, 'status call should not error');
        tt.deepEqual(status, STATUS, 'Status response should match');
        tt.end();
      });
    });

    t.test('Status summary CLI', function(tt) {
      exec.resetHome();
      exec(port, 'status', function(err, stdout) {
        tt.ifError(err, 'command shoudl not error');
        tt.equal(RENDERED_STATUS, stdout, 'Rendered status should match');
        tt.end();
      });
    });

    t.test('Cleanup', function(tt) {
      server.stop(tt.end.bind(tt));
    });

    t.end();
  });
});
