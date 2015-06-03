var _ = require('lodash');
var assert = require('assert');
var boot = require('loopback-boot');
var debug = require('debug')('strong-mesh-models:client');
var loopback = require('loopback');
var serverService = require('./models/server-service');
var serviceInstance = require('./models/service-instance');
var url = require('url');
var urlDefaults = require('strong-url-defaults');
var util = require('util');
var path = require('path');

/**
 * Mesh API Client
 *
 * @param {string} apiUrl URL for Mesh server. Formats supported include:
 *   * /full/path/to.socket
 *   * ./relative/path/to/socket
 *   * http+unix:///full/path/to/socket
 *   * http://host:port
 *      - Uses 127.0.0.1 if host is omitted
 *      - Uses 8701 if port is omitted
 * @param {object} [options] Options object
 * @param {string} [options.overridePath] Path to where API is mounted on remote
 * server. This is normally `/api` however can be overridden if proxies or
 * mounted at a different location.
 * @param {string} [options.appBrowserifyId] Used by loopback-boot to load the
 * correct set of models when building a browserify'ed bundle with multiple
 * loopback apps. Defaults to `meshClient`.
 * @constructor
 */
function Client(apiUrl, options) {
  options = options || {};

  // Useful in cases where the API requests are being proxies. This is used in
  // Arc for the internal PM.
  var apiBasePath = options.overridePath || '/api';

  // Normalize the URI
  var endpoint = url.parse(apiUrl);
  if (!endpoint.protocol) {
    this.apiUrl = util.format(
      'http://unix:%s:%s',
      path.resolve(apiUrl), apiBasePath
    );
  } else if (endpoint.protocol === 'http+unix:') {
    // Convert from our CLI format to the format request wants.
    this.apiUrl = util.format(
      'http://unix:%s:/%s',
      endpoint.pathname, apiBasePath
    );
  } else if (endpoint.protocol === 'http:') {
    this.apiUrl = urlDefaults(
      apiUrl,
      {host: '127.0.0.1', port: 8701},
      {path: apiBasePath}
    );
  } else {
    throw Error('Unknown protocol: ' + endpoint.protocol + '//');
  }
  debug('connecting to %s', this.apiUrl);

  var client = loopback();
  client.dataSource('remote', {'connector': 'remote', 'url': this.apiUrl});
  boot(client, {
    // ID used by browserified loopback-boot to load correct set of models
    appId: options.appBrowserifyId || 'meshClient',
    appRootDir: __dirname
  });
  client.set('apiUrl', this.apiUrl);

  this.loopback = client;
  this.models = client.models;
  this.apiVersion = require('../package.json').apiVersion;

  // Populates the cache of models so you can access them with
  // client.models.ModelName.
  client.models();

  // See comment in `client/models/server-service.js` for detail on why this is
  // loaded here.
  serverService(client.models.ServerService);
  serviceInstance(client.models.ServiceInstance);
}
module.exports = Client;

function checkRemoteApiSemver(callback) {
  var self = this;

  self.apiInfo(function(err, info) {
    // 404 means the route isn't there, so its an old PM.
    // Success means it supports the info command, we can check versions.
    // Anything else we shrug off so that the specific command can deal with
    // it (and the unit tests don't fully implement the info API, and since
    // its is technically optional, forcing it to exist is harmful).

    if (err) {
      debug('apiInfo error:', err);

      if (err.statusCode === 404)
        return callback(new Error(
          'incompatible remote API v5 or earlier'
        ));
      return callback();
    }

    var localMajor = self.apiVersion.split('.')[0];
    var remoteMajor = info.apiVersion.split('.')[0];

    debug('local %s %s.x remote %s %s.x', self.apiVersion, localMajor,
          info.apiVersion, remoteMajor);

    if (localMajor !== remoteMajor) {
      return callback(new Error(
        'incompatible remote API v' + info.apiVersion
      ));
    }
    return callback();
  });
}
Client.prototype.checkRemoteApiSemver = checkRemoteApiSemver;

function serviceFindOrCreate(name, scale, callback) {
  var self = this;
  self.serviceFind(name, function(err, service) {
    if (err && err.statusCode !== 404) return callback(err);
    if (service) return callback(null, service);
    self.serviceCreate(name, scale, callback);
  });
}
Client.prototype.serviceFindOrCreate = serviceFindOrCreate;

function serviceCreate(name, scale, callback) {
  var Service = this.models.ServerService;

  if (scale == null) scale = 1;
  var service = {name: name, _groups: [{id: 1, name: 'default', scale: scale}]};
  Service.create(service, callback);

  return this;
}
Client.prototype.serviceCreate = serviceCreate;

function serviceList(callback) {
  var Service = this.models.ServerService;
  return Service.find({order: ['id ASC']}, callback);
}
Client.prototype.serviceList = serviceList;

function serviceDestroy(nameOrId, callback) {
  var Service = this.models.ServerService;

  var q = {where: {or: [{name: nameOrId}, {id: nameOrId}]}};
  Service.findOne(q, function(err, service) {
    if (err || !service) return callback(err, service);

    Service.deleteById(service.id, callback);
  });

  return this;
}
Client.prototype.serviceDestroy = serviceDestroy;

/**
 * Find a service.
 *
 * @param {string|number} serviceNameOrId Service ID or Name.
 * Service with the lowest ID will be returned.
 * @param {function} callback Callback function.
 */
function serviceFind(serviceNameOrId, callback) {
  var Service = this.models.ServerService;

  var filter = {order: ['id ASC']};
  if (serviceNameOrId) {
    filter.where = {
      or: [
        {name: serviceNameOrId},
        {id: serviceNameOrId}
      ]
    };
  }
  Service.findOne(filter, callback);
}
Client.prototype.serviceFind = serviceFind;

function groupCreate(serviceNameOrId, groupName, scale, callback) {
  var Service = this.models.ServerService;
  var filter = {
    where: {
      or: [
        {name: serviceNameOrId},
        {id: serviceNameOrId}
      ]
    }
  };
  Service.findOne(filter, function(err, service) {
    if (!service) {
      // We could create it, but then it wouldn't have a default. Until further
      // requirements, groups can only be set on existing services.
      return callback(err, service);
    }

    debug('groupCreate before: %j', service);

    var group = _.find(service._groups, {name: groupName});

    if (group) {
      group.scale = scale;
    } else {
      service._groups.push({name: groupName, scale: scale});
    }

    debug('groupCreate after: %j', service);

    service.save(function(err, s) {
      if (!err) assert(s);
      callback(err, service);
    });
  });

  return this;
}
Client.prototype.groupCreate = groupCreate;

function instanceList(serviceNameOrId, callback) {
  var Service = this.models.ServerService;
  var ServiceInstance = this.models.ServiceInstance;
  var filter = {
    where: {
      or: [
        {name: serviceNameOrId},
        {id: serviceNameOrId}
      ]
    }
  };
  Service.findOne(filter, function(err, service) {
    if (err || !service) return callback(err, service);

    var q = {where: {serverServiceId: service.id}, order: ['id ASC']};
    ServiceInstance.find(q, callback);
  });
}
Client.prototype.instanceList = instanceList;

function instanceFind(instanceId, callback) {
  var ServiceInstance = this.models.ServiceInstance;

  ServiceInstance.findById(instanceId, function(err, instance) {
    if (err || !instance) return callback(err);
    callback(null, instance);
  });
}
Client.prototype.instanceFind = instanceFind;

function getApi() {
  return this.models.Api;
}
Client.prototype.getApi = getApi;

/**
 * Find the service, executor, instance and process based on target ID.
 *
 * @param {string}targetId ID in the format <Service.Executor.Process>.
 * default to the lowest available IDs.
 * @param {function} callback Callback function.
 */
function resolveTarget(targetId, callback) {
  targetId = targetId.split('.').slice(0, 3);
  var processId = targetId.pop();
  var serviceId = targetId.shift();
  var executorId = targetId.pop();
  debug('Target input to: %j',
    {proc: processId, serv: serviceId || '?', exec: executorId || '?'});

  var ServiceInstance = this.models.ServiceInstance;
  var ServerService = this.models.ServerService;
  var Executor = this.models.Executor;

  var serviceFilter = {order: ['id ASC']};
  if (serviceId) {
    serviceFilter.where = {
      or: [
        {name: serviceId},
        {id: serviceId}
      ]
    };
  }
  return ServerService.findOne(serviceFilter, resolveExecutor);

  function resolveExecutor(err, service) {
    if (err) return callback(err);
    if (!service) return callback(Error('Service not found'));
    var executorFilter = {order: ['id ASC']};
    if (executorId) executorFilter.where = {id: executorId};
    Executor.findOne(executorFilter, resolveInstance.bind(null, service));
  }

  function resolveInstance(service, err, executor) {
    if (err) return callback(err);
    if (!executor) return callback(Error('Service not found'));
    var instanceFilter = {where: {
      serverServiceId: service.id,
      executorId: executor.id
    }};
    ServiceInstance.findOne(instanceFilter,
      resolveProcess.bind(null, service, executor));
  }

  function resolveProcess(service, executor, err, instance) {
    if (err) return callback(err);
    if (!instance) return callback(Error('Service not deployed'));
    var processFilter = {
      limit: 1,
      where: {or: [{pid: processId}, {workerId: processId}], stopReason: ''}
    };
    instance.processes(processFilter, function(err, processes) {
      if (err) return callback(err);
      if (processes.length !== 1) return callback('Unable to find process');
      var process = processes[0];
      debug('Target resolved to: %j', {
        proc: process.pid, serv: service.id,
        exec: executor.id, inst: instance.id
      });
      callback(err, service, executor, instance, process);
    });
  }
}
Client.prototype.resolveTarget = resolveTarget;

/**
 * Find the service, executor, instance based on target ID.
 *
 * @param {string} targetId ID in the format <Service.Executor>.
 * default to the lowest available IDs.
 * @param {function} callback Callback function.
 */
function resolveInstance(targetId, callback) {
  targetId = targetId.split('.').slice(0, 3);
  var serviceId = targetId.shift();
  var executorId = targetId.pop();
  debug('Instance input to: %j',
    {serv: serviceId || '?', exec: executorId || '?'});

  var ServiceInstance = this.models.ServiceInstance;
  var ServerService = this.models.ServerService;
  var Executor = this.models.Executor;

  var serviceFilter = {order: ['id ASC']};
  if (serviceId) {
    serviceFilter.where = {
      or: [
        {name: serviceId},
        {id: serviceId}
      ]
    };
  }
  return ServerService.findOne(serviceFilter, resolveExecutor);

  function resolveExecutor(err, service) {
    if (err) return callback(err);
    if (!service) return callback(Error('Service not found'));
    var executorFilter = {order: ['id ASC']};
    if (executorId) executorFilter.where = {id: executorId};
    Executor.findOne(executorFilter, resolveInstance.bind(null, service));
  }

  function resolveInstance(service, err, executor) {
    if (err) return callback(err);
    if (!executor) return callback(Error('Service not found'));
    var instanceFilter = {where: {
      serverServiceId: service.id,
      executorId: executor.id
    }};
    ServiceInstance.findOne(instanceFilter, function(err, instance) {
      if (err) return callback(err);
      debug('Instance resolved to: %j', {
        serv: service.id, exec: executor.id, inst: instance.id
      });
      callback(err, service, executor, instance);
    });
  }
}
Client.prototype.resolveInstance = resolveInstance;

function apiInfo(callback) {
  var Api = this.models.Api;
  Api.apiInfo(callback);
}
Client.prototype.apiInfo = apiInfo;

function dailyExpressMetricsSummary(callback) {
  this.models.ExpressUsageRecord.dailySummary(callback);
}
Client.prototype.dailyExpressMetricsSummary = dailyExpressMetricsSummary;

function hourlyExpressMetricsSummary(modelOrUri, callback) {
  this.models.ExpressUsageRecord.hourlySummary(modelOrUri, callback);
}
Client.prototype.hourlyExpressMetricsSummary = hourlyExpressMetricsSummary;

function expressMetricsEndpointDetail(modelOrUri, windowStartTime, callback) {
  this.models.ExpressUsageRecord.endpointDetail(
    modelOrUri, windowStartTime, callback
  );
}
Client.prototype.expressMetricsEndpointDetail = expressMetricsEndpointDetail;

function executorCreate(driver, callback) {
  this.models.Executor.create({
    driver: driver || 'executor'
  }, callback);
}
Client.prototype.executorCreate = executorCreate;

function executorList(callback) {
  this.models.Executor.find({}, callback);
}
Client.prototype.executorList = executorList;

function executorDestroy(id, callback) {
  this.models.Executor.deleteById(id, callback);
}
Client.prototype.executorDestroy = executorDestroy;
