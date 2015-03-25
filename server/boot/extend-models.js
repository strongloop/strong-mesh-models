var Api = require('../models/api');
var agentTrace = require('../models/agent-trace');
var expressUsageRecord = require('../models/express-usage-record');
var serviceInstance = require('../models/service-instance');
var serviceMetric = require('../models/service-metric');
var serviceProcess = require('../models/service-process');

module.exports = function(server) {
  Api(server.models.Api);
  agentTrace(server.models.AgentTrace);
  expressUsageRecord(server.models.ExpressUsageRecord);
  serviceInstance(server.models.ServiceInstance);
  serviceMetric(server.models.ServiceMetric);
  serviceProcess(server.models.ServiceProcess);
};
