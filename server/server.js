/* eslint no-console:0 */
var ServiceManager = require('./service-manager');
var boot = require('loopback-boot');
var debug = require('debug')('strong-mesh-models:server');
var loopback = require('loopback');

function server(serviceManager) {
  var app = module.exports = loopback();
  app.serviceManager = serviceManager;

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
    this._server.close(function() {
      app.emit('stopped');
      if (callback) callback();
    });
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
