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
  boot(client, __dirname);
  client.set('apiUrl', this.apiUrl);

  this.loopback = client;
  this.models = client.models;

  // Populates the cache of models so you can access them with
  // client.models.ModelName.
  client.models();

  // See comment in `client/models/server-service.js` for detail on why this is
  // loaded here.
  serverService(client.models.ServerService);
  serviceInstance(client.models.ServiceInstance);
}
module.exports = Client;

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

function serviceDestroy(name, callback) {
  var Service = this.models.ServerService;

  var q = {where: {name: name}};
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
 * @param {function} callback Callback function.
 */
function serviceFind(serviceNameOrId, callback) {
  var Service = this.models.ServerService;
  var filter = {
    where: {
      or: [
        {name: serviceNameOrId},
        {id: serviceNameOrId}
      ]
    }
  };
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
