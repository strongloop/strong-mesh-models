var Api = require('../models/api');
var agentTrace = require('../models/agent-trace');
var executor = require('../models/executor');
var expressUsageRecord = require('../models/express-usage-record');
var profileData = require('../models/profile-data');
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
};
