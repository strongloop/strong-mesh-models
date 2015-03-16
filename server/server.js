/* eslint no-console:0 */
var ServiceManager = require('./service-manager');
var assert = require('assert');
var boot = require('loopback-boot');
var debug = require('debug')('strong-mesh-models:server');
var loopback = require('loopback');
var MinkeLite = require('minkelite');

function server(serviceManager, options) {
  var app = module.exports = loopback();
  app.serviceManager = serviceManager;
  options = options || {};

  for (var k in options) {
    if (!options.hasOwnProperty(k)) continue;
    app.set(k, options[k]);
  }

  assert(!app.get('trace.db.inMemory') && !app.get('trace.db.path'),
    'The path for trace data storage is required');

  /* eslint-disable camelcase */
  app.minkelite = new MinkeLite({
    start_server: !!app.get('trace.enableDebugServer'),
    server_port: app.get('trace.debugServerPort') || 8104,

    in_memory: !!app.get('trace.db.inMemory'),
    db_name: app.get('trace.db.name'),
    db_path: app.get('trace.db.path'),

    // data points shown on the Timeline view
    chart_minutes: parseInt(app.get('trace.data.chartMinutes'), 10) || 1440,
    // how long we retain data in the db
    stale_minutes: parseInt(app.get('trace.data.staleMinutes'), 10) || 1450,
    max_transaction_count:
      parseInt(app.get('trace.data.maxTransaction'), 10) || 100
  });
  /* eslint-enable camelcase */

  // Bootstrap the application, configure models, datasources and middleware.
  // Sub-apps like REST API are mounted via boot scripts.
  boot(app, __dirname);

  app.start = function(callback) {
    // start the web server
    app._server = app.listen(function() {
      var addr = this.address();
      app.emit('started', addr.port);
      console.log('Web server listening at port: %s', addr.port);
      if (callback) return callback(null, addr.port);
    });
    return;
  };

  app.stop = function(callback) {
    this.minkelite.shutdown();

    if (!this._server) {
      return cb();
    }
    this._server.close(cb);

    function cb() {
      app.emit('stopped');
      if (callback) callback();
    }
  };

  app.handleModelUpdate = function(instanceId, uInfo, callback) {
    // These are all currently notifications, so callback is optional and unused
    // However, the unit tests need to know when models have been updated, so
    // take care to not callback until any actions are complete.
    if (!callback) {
      callback = function(err) {
        if (err) throw Error(err);
      };
    }

    var ServiceMetric = app.models.ServiceMetric;
    var AgentTrace = app.models.AgentTrace;
    var ExpressUsageRecord = app.models.ExpressUsageRecord;
    var ServiceProcess = app.models.ServiceProcess;
    var ServiceInstance = app.models.ServiceInstance;

    switch (uInfo.cmd) {
      case 'started':
        ServiceInstance.recordInstanceInfo(instanceId, uInfo, function(err) {
          if (err) return callback(err);
          ServiceProcess.recordFork(instanceId, uInfo, callback);
        });
        break;
      case 'fork':
        ServiceProcess.recordFork(instanceId, uInfo, callback);
        break;
      case 'exit':
        ServiceProcess.recordExit(instanceId, uInfo, callback);
        break;
      case 'listening':
        ServiceProcess.recordListeningEndpoint(instanceId, uInfo, callback);
        break;
      case 'object-tracking':
      case 'cpu-profiling':
      case 'heap-snapshot':
        ServiceProcess.recordProfilingState(instanceId, uInfo, callback);
        break;
      case 'status':
        // not used
        callback();
        break;
      case 'metrics':
        ServiceMetric.recordMetrics(instanceId, uInfo, callback);
        break;
      case 'agent:trace':
        AgentTrace.recordTrace(instanceId, uInfo, callback);
        break;
      case 'trace:object':
        var traceVersion = uInfo.record.version;
        var accountName = uInfo.record.packet.metadata.account_key;
        app.minkelite.postRawPieces(
          traceVersion, accountName, uInfo.record.packet, callback
        );
        break;
      case 'express:usage-record':
        ExpressUsageRecord.recordUsage(instanceId, uInfo, callback);
        break;
      default:
        debug('Unknown request: %j', uInfo);
        callback();
        break;
    }
  };

  app.setServiceCommit = function(serviceId, commit, callback) {
    var ServerService = app.models.ServerService;
    ServerService.setServiceCommit(serviceId, commit, callback);
  };

  return app;
}

// start the server if `$ node server.js`
if (require.main === module) {
  var appServer = server(new ServiceManager());
  appServer.start();
}

module.exports = server;
