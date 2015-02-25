var assert = require('assert');
var _ = require('lodash');
var boot = require('loopback-boot');
var debug = require('debug')('MeshModels.client');
var loopback = require('loopback');
var url = require('url');

function Client(apiUrl) {
  // Normalize the URI
  var endpoint = url.parse(apiUrl);
  debug('normalize endpoint %j', endpoint);
  endpoint.pathname = '/api'; // Loopback is mounted here
  endpoint.hostname = endpoint.hostname || 'localhost'; // Allow `http://:8888`
  delete endpoint.host; // So .hostname and .port are used to construct URL
  apiUrl = url.format(endpoint);

  debug('connecting to %s', apiUrl);

  var client = loopback();
  client.dataSource('remote', {'connector': 'remote', 'url': apiUrl});
  boot(client, __dirname);

  this.loopback = client;
  this.models = client.models;

  // Resolve the models
  client.models();
}
module.exports = Client;

function serviceCreate(name, scale, callback) {
  var Service = this.models.Service;

  if (scale == null) scale = 1;
  var service = {name: name, _groups: [{id: 1, name: 'default', scale: scale}]};
  Service.create(service, callback);

  return this;
}
Client.prototype.serviceCreate = serviceCreate;

function serviceList(callback) {
  var Service = this.models.Service;
  return Service.find({}, sortById.bind(null, callback));
}
Client.prototype.serviceList = serviceList;

function serviceDestroy(name, callback) {
  var Service = this.models.Service;

  var q = {where: {name: name}};
  Service.findOne(q, function(err, service) {
    if (err || !service) return callback(err, service);

    Service.deleteById(service.id, callback);
  });

  return this;
}
Client.prototype.serviceDestroy = serviceDestroy;

function groupCreate(serviceName, groupName, scale, callback) {
  var Service = this.models.Service;
  var filter = {
    where: {
      name: serviceName,
    },
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

function instanceList(serviceName, callback) {
  var Service = this.models.Service;
  var ServiceInstance = this.models.ServiceInstance;
  var filter = {
    where: {
      name: serviceName,
    },
  };
  Service.findOne(filter, function(err, service) {
    if (err || !service) return callback(err, service);

    var q = {where: {serverServiceId: service.id}};
    ServiceInstance.find(q, sortById.bind(null, callback));
  });
}
Client.prototype.instanceList = instanceList;

function runCommand(instance, req, callback) {
  instance.actions.create({
    request: req
  }, function(err, action) {
    if (err) return callback(err);
    if (action.result && action.result.error)
      return callback(Error(action.result.error));

    callback(null, action.result);
  });
}
Client.prototype.runCommand = runCommand;

function sortById(callback, err, result) {
  if (err || !result) return callback(err);

  if (result.length) {
    result = _.sortBy(result, 'id');
  }
  callback(err, result);
}
