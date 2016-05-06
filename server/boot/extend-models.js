// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: strong-mesh-models
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

var agentTrace = require('../models/agent-trace');
var Api = require('../models/api');
var executor = require('../models/executor');
var expressUsageRecord = require('../models/express-usage-record');
var gateway = require('../models/gateway');
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
  gateway(server.models.Gateway);
};
