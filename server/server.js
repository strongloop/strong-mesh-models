/* eslint no-console:0 */
var ServiceManager = require('./service-manager');
var assert = require('assert');
var boot = require('loopback-boot');
var debug = require('debug')('strong-mesh-models:server');
var loopback = require('loopback');

/**
 * Factory method that returns a loopback server object. This object can be used
 * as express middleware.
 *
 * @param {ServiceManager} serviceManager
 * @param {Minkelite} minkelite instance for tracing
 * @param {object} options Options object
 */
function server(serviceManager, minkelite, options) {
  var app = module.exports = loopback();
  app.serviceManager = serviceManager;
  options = options || {};

  var duration1Day = 24 * 60 * 60 * 1000;
  options['ExpressUsageRecord.deleteWindow'] =
    options['ExpressUsageRecord.deleteWindow'] || String(duration1Day);

  for (var k in options) {
    if (!options.hasOwnProperty(k)) continue;
    app.set(k, options[k]);
  }

  app.minkelite = minkelite;

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
    if (this.minkelite)
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
      callback = assert.ifError;
    }

    var AgentTrace = app.models.AgentTrace;
    var ExpressUsageRecord = app.models.ExpressUsageRecord;
    var ProfileData = app.models.ProfileData;
    var ServiceInstance = app.models.ServiceInstance;
    var ServiceMetric = app.models.ServiceMetric;
    var ServiceProcess = app.models.ServiceProcess;

    switch (uInfo.cmd) {
      case 'started':
        // Note carefully that strong-pm doesn't actually pass the started cmd
        // directly, it first annotates it with a bunch of extra information.
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
        ServiceInstance.recordStatusUpdate(instanceId, uInfo, callback);
        break;
      case 'metrics':
        ServiceMetric.recordMetrics(instanceId, uInfo, callback);
        break;
      case 'agent:trace':
        AgentTrace.recordTrace(instanceId, uInfo, callback);
        break;
      case 'trace:object':
        if (!app.minkelite)
          return callback();
        var record = JSON.parse(uInfo.record);
        app.minkelite.postRawPieces(record.version,
          record.packet.metadata.account_key,
          record.packet,
          callback);
        break;
      case 'express:usage-record':
        ExpressUsageRecord.recordUsage(instanceId, uInfo, callback);
        break;
      case 'cpu:profile-data':
        ProfileData.recordProfileData(instanceId, uInfo, callback);
        break;
      case 'status:wd':
        ServiceProcess.recordStatusWdUpdate(instanceId, uInfo, function(err) {
          if (err) return callback(err);

          // Work around for versions of supervisor which dont include appName
          // in status:wd message
          if (!uInfo.appName) {
            return process.nextTick(callback);
          }

          ServiceInstance.recordStatusWdUpdate(instanceId, uInfo, callback);
        });
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
