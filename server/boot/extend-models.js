var async = require('async');
var agentTrace = require('../models/agent-trace');
var Api = require('../models/api');
var executor = require('../models/executor');
var expressUsageRecord = require('../models/express-usage-record');
var gateway = require('../models/gateway');
var profileData = require('../models/profile-data');
var serverService = require('../models/server-service');
var serviceInstance = require('../models/service-instance');
var serviceMetric = require('../models/service-metric');
var serviceProcess = require('../models/service-process');

module.exports = function(server) {
  Api(server.models.Api);
  agentTrace(server.models.AgentTrace);
  executor(server.models.Executor);
  expressUsageRecord(server.models.ExpressUsageRecord);
  profileData(server.models.ProfileData);
  serviceInstance(server.models.ServiceInstance);
  serviceMetric(server.models.ServiceMetric);
  serviceProcess(server.models.ServiceProcess);
  gateway(server.models.Gateway);
  var modelsToWatch = [
    {name: 'agenttrace', instance: agentTrace},
    {name: 'executor', instance: executor},
    {name: 'expressusagerecord', instance: expressUsageRecord},
    {name: 'profiledata', instance: profileData},
    {name: 'serviceinstance', instance: serviceInstance},
    {name: 'serverservice', instance: serverService},
    {name: 'servicenetric', instance: serviceMetric},
    {name: 'serviceprocess', instance: serviceProcess},
    {name: 'gateway', instance: gateway},
  ];
  server.on('ready', function(dbWatcher) {
    async.eachSeries(modelsToWatch, function(model, callback) {
      if (model.instance.modelWatcher) {
        dbWatcher.on(model.name, model.instance.modelWatcher);
        dbWatcher.watchTable(model.name, function(err) {
          callback(err);
        });
      } else {
        callback();
      }
    });
  });
};
