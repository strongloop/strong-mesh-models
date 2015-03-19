var ServiceManager = require('../index').ServiceManager;
var async = require('async');
var meshServer = require('../index').meshServer;
var os = require('os');
var test = require('tap').test;

test('Test notifications', function(t) {
  var app = meshServer(new ServiceManager());
  app.set('port', 0);

  t.test('Initialize models', function(tt) {
    var s = {
      id: 1,
      name: 's1',
      _groups: [{id: 1, name: 'g1', scale: 1}]
    };
    var e = {
      id: 1,
      address: '127.0.0.1',
      APIPort: 5000,
      totalCapacity: 1,
      remainingCapacity: 0
    };
    var i = {
      executorId: 1,
      serverServiceId: 1,
      groupId: 1
    };

    var ServerService = app.models.ServerService;
    var ServiceInstance = app.models.ServiceInstance;
    var Executor = app.models.Executor;
    async.series([
      ServerService.create.bind(ServerService, s),
      Executor.create.bind(Executor, e),
      ServiceInstance.create.bind(ServiceInstance, i)
    ], function(err) {
      tt.ifError(err);
      tt.end();
    });
  });

  t.test('Notify started', function(tt) {
    var notification = {
      cmd: 'started',
      commitHash: 'some hash',
      appName: 'my app',
      npmModules: {name: 'list of npm modules'},
      PMPort: 5000,
      containerVersionInfo: {
        os: {
          platform: os.platform(),
          arch: os.arch(),
          release: os.release()
        },
        node: process.version,
        container: {
          name: 'test-container',
          version: 10.0
        },
      },
      setSize: 1,
      agentVersion: '1.0.2',
      restartCount: 10,

      id: 0,
      pid: 1234,
      ppid: 3456,
    };
    app.handleModelUpdate(1, notification, function(err) {
      tt.ifError(err);
      tt.end();
    });
  });

  t.test('Check instance data', function(tt) {
    app.models.ServiceInstance.find({}, function(err, instances) {
      tt.ok(!err, 'instances should be found');
      tt.equal(instances.length, 1, 'only one instance should be found');
      var inst = instances[0] || {};
      tt.equal(inst.currentDeploymentId, 'some hash',
        'commit hash should match');
      tt.ok(!!inst.startTime, 'start time should be set');
      tt.ok(!!inst.started, 'started should be true');
      tt.equal(inst.applicationName, 'my app', 'app name should match');
      tt.deepEqual(inst.npmModules, {name: 'list of npm modules'});
      tt.equal(inst.PMPort, 5000, 'PM port should match');
      tt.deepEqual(inst.containerVersionInfo, {
        os: {
          platform: os.platform(),
          arch: os.arch(),
          release: os.release()
        },
        node: process.version,
        container: {
          name: 'test-container',
          version: 10.0
        },
      }, 'Container information should be set');
      tt.equal(inst.setSize, 1, 'set size should match');
      tt.equal(inst.agentVersion, '1.0.2', 'agent version should match');
      tt.equal(inst.restartCount, 10, 'restart count should match');
      tt.end();
    });
  });

  t.test('Check worker 0', function(tt) {
    var q = {where: {
      workerId: 0,
      serviceInstanceId: 1
    }};
    app.models.ServiceProcess.find(q, function(err, procs) {
      tt.ok(!err, 'process should be found');
      tt.equal(procs.length, 1, 'only one process should be found');
      var proc = procs[0] || {};
      tt.equal(proc.parentPid, 3456, 'parent pid should match');
      tt.equal(proc.pid, 1234, 'pid should match');
      tt.ok(!proc.isTrackingObjects, 'tracking-obj should be false');
      tt.ok(!proc.isProfiling, 'tracking-obj should be false');
      tt.ok(!proc.isSnapshotting, 'tracking-obj should be false');
      tt.ok(!!proc.startTime, 'start time should be set');
      tt.ok(!proc.stopTime, 'stop time should not be set');
      tt.ok(!proc.stopReason, 'stop reason should not be set');
      tt.end();
    });
  });

  t.test('Notify fork', function(tt) {
    var notification = {
      cmd: 'fork',
      id: 1,
      pid: 1235,
      ppid: 1234,
    };
    app.handleModelUpdate(1, notification, function(err) {
      tt.ifError(err);
      tt.end();
    });
  });

  t.test('Notify listen', function(tt) {
    var notification = {
      cmd: 'listening',
      id: 1,
      pid: 1235,
      address: {
        address: '0.0.0.0',
        port: 59176,
        addressType: 4
      }
    };
    app.handleModelUpdate(1, notification, function(err) {
      tt.ifError(err);
      tt.end();
    });
  });

  function checkWorker1(prof, tt) {
    var q = {where: {
      workerId: 1,
      serviceInstanceId: 1
    }};
    app.models.ServiceProcess.find(q, function(err, procs) {
      tt.ok(!err, 'process should be found');
      tt.equal(procs.length, 1, 'only one process should be found');
      var proc = procs[0] || {};
      tt.equal(proc.parentPid, 1234, 'parent pid should match');
      tt.equal(proc.pid, 1235, 'pid should match');
      tt.equal(proc.isTrackingObjects, prof.isTrackingObjects || false,
        'tracking-obj should match');
      tt.equal(proc.isProfiling, prof.isProfiling || false,
        'cpu-profiling should match');
      tt.equal(proc.isSnapshotting, prof.isSnapshotting || false,
        'heap-snapshotting should match');
      tt.ok(!!proc.startTime, 'start time should be set');
      tt.ok(!proc.stopTime, 'stop time should not be set');
      tt.ok(!proc.stopReason, 'stop reason should not be set');
      tt.deepEqual(proc.listeningSockets, [
        {
          address: '0.0.0.0',
          port: 59176,
          addressType: 4
        }
      ]);
      tt.end();
    });
  }

  function notifyProfiling(type, value, tt) {
    var notification = {
      cmd: type,
      id: 1,
      pid: 1235,
      isRunning: value
    };
    app.handleModelUpdate(1, notification, function(err) {
      tt.ifError(err);
      tt.end();
    });
  }

  t.test('Notify object-tracking on',
    notifyProfiling.bind(this, 'object-tracking', true));
  t.test('Check worker 1 isTrackingObjects',
    checkWorker1.bind(this, {isTrackingObjects: true}));
  t.test('Notify object-tracking off',
    notifyProfiling.bind(this, 'object-tracking', false));

  t.test('Notify cpu-profiling on',
    notifyProfiling.bind(this, 'cpu-profiling', true));
  t.test('Check worker 1 isProfiling',
    checkWorker1.bind(this, {isProfiling: true}));
  t.test('Notify cpu-profiling off',
    notifyProfiling.bind(this, 'cpu-profiling', false));

  t.test('Notify heap-snapshot on',
    notifyProfiling.bind(this, 'heap-snapshot', true));
  t.test('Check worker 1 isSnapshotting',
    checkWorker1.bind(this, {isSnapshotting: true}));
  t.test('Notify heap-snapshot off',
    notifyProfiling.bind(this, 'heap-snapshot', false));

  var METRIC_ENTRY = {
    counters: {
      'loop.count': 100
    },
    timers: {},
    gauges: {
      'loop.minimum': 0,
      'loop.maximum': 8,
      'loop.average': 0.94,
      'gc.heap.used': 8848823,
      'heap.used': 9163153,
      'heap.total': 33088428,
      'cpu.total': 0.79031,
      'cpu.system': 0.63311,
      'cpu.user': 0.1572
    }
  };

  function notifyMetrics(dateBy, tt) {
    var notification = {
      cmd: 'metrics',
      id: 1,
      pid: 1235,
      metrics: {
        processes: {
          '1': METRIC_ENTRY
        },
        'timestamp': (new Date()) - dateBy
      }
    };
    app.handleModelUpdate(1, notification, function(err) {
      tt.ifError(err);
      tt.end();
    });
  }

  t.test('Notify metrics with current data',
    notifyMetrics.bind(this, 0));
  t.test('Notify metrics with stale data',
    notifyMetrics.bind(this, 10 * 60 * 1000));

  t.test('Check worker 1 metrics', function(tt) {
    app.models.ServiceMetric.find({}, function(err, metrics) {
      tt.ok(!err, 'metrics should be found');
      tt.equal(metrics.length, 1, 'only one metric should be present');
      var metric = metrics[0];
      tt.equal(metric.processId, 2, 'process id should match');
      tt.deepEqual(metric.counters, METRIC_ENTRY.counters);
      tt.deepEqual(metric.timers, METRIC_ENTRY.timers);
      tt.deepEqual(metric.gauges, METRIC_ENTRY.gauges);
      tt.end();
    });
  });

  function notifyTraces(dateBy, tt) {
    var time = (new Date()) - dateBy;
    var traceRecord = {
      start: time,
      collectionName: 'httpCalls',
      list: [
        [
          time, '/xyzzy', 13.092878, 0,
          {closed: true, mysql: 2.351871, mongodb: 1.623075},
        ], [
          time, '/xyzzy', 13.092878, 0,
          {closed: true, mysql: 2.351871, mongodb: 1.623075},
        ]
      ]
    };

    var notification = {
      cmd: 'agent:trace',
      processId: 1235,
      trace: traceRecord
    };
    app.handleModelUpdate(1, notification, function(err) {
      tt.ifError(err);
      tt.end();
    });
  }

  t.test('Notify trace with current data',
    notifyTraces.bind(this, 0));
  t.test('Notify trace with stale data',
    notifyTraces.bind(this, 10 * 60 * 1000));

  t.test('Check worker 1 traces', function(tt) {
    app.models.AgentTrace.find({}, function(err, traces) {
      tt.ok(!err, 'traces should be found');
      tt.equal(traces.length, 2, 'only two traces should be present');
      var trace = traces[0];
      tt.equal(trace.processId, 2, 'process id should match');
      tt.ok(!!trace.trace, 'trace should be populated');
      tt.end();
    });
  });


  function notifyExpressRecord(dateBy, tt) {
    var rec = {
      timestamp: Date.now() - dateBy,
      client: {address: '::1'},
      request: {method: 'GET', url: '/'},
      response: {status: 404, duration: 6},
      process: {pid: 1235},
      data: {custom: 'value'}
    };

    var notification = {
      cmd: 'express:usage-record',
      record: rec
    };
    app.handleModelUpdate(1, notification, function(err) {
      tt.ifError(err);
      tt.end();
    });
  }

  t.test('Notify express usage records with current data',
    notifyExpressRecord.bind(this, 0));
  t.test('Notify express usage records with stale data',
    notifyExpressRecord.bind(this, 10 * 60 * 1000));

  t.test('Check worker 1 express usage records', function(tt) {
    app.models.ExpressUsageRecord.find({}, function(err, records) {
      tt.ok(!err, 'express usage records should be found');
      tt.equal(records.length, 1, 'only one record should be present');
      var record = records[0];
      tt.equal(record.processId, 2, 'process id should match');
      tt.equal(record.workerId, 1);
      tt.ok(!!record.detail, 'Usage detail is present');
      tt.end();
    });
  });

  t.test('Emit exit', function(tt) {
    var notification = {
      cmd: 'exit',
      pid: 1234,
      id: 0,
      reason: 'foo',
    };
    app.handleModelUpdate(1, notification, function(err) {
      tt.ifError(err);
      tt.end();
    });
  });

  t.test('Check process exit state', function(tt) {
    var ServiceProcess = app.models.ServiceProcess;
    ServiceProcess.find({where: {workerId: 0}}, function(err, procs) {
      tt.ok(!err, 'process records should be found');
      tt.equal(procs.length, 1, 'only one process should be present');
      var proc = procs[0];
      tt.equal(proc.stopReason, 'foo', 'stop reason should match');
      tt.ok(!!proc.stopTime, 'stop time should be set');
      ServiceProcess.find({where: {workerId: 1}}, function(err, procs) {
        tt.ok(!err, 'process records should be found');
        tt.equal(procs.length, 1, 'only one process should be present');
        var proc = procs[0];
        tt.equal(proc.stopReason, 'foo', 'stop reason should match on child');
        tt.equal(proc.stopReason, 'foo', 'stop reason should match on child');

        // Stop time should be within the last minute or so.
        var timeWindow = (new Date()) - (1 * 60 * 1000);
        tt.ok(timeWindow <= proc.stopTime, 'stop time should be set');
        tt.end();
      });
    });
  });

  t.test('shutdown', function(tt) {
    app.stop();
    tt.end();
  });

  t.end();
});
