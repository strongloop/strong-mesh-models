var async = require('async');
var request = require('request');
var util = require('util');

module.exports = function extServerService(ServerService) {
  function getDeployEndpoint() {
    var apiUrl = ServerService.app.get('apiUrl');
    return util.format('%s/services/%s/deploy', apiUrl, this.id);
  }
  ServerService.prototype.getDeployEndpoint = getDeployEndpoint;

  // Note:
  //
  // Methods like `ServerService.deploy` and `ServerService.getPack` are remote
  // methods defined using the http ctx object. See
  // `common/models/service.js#L19`. This means that when you boot up the
  // models, LB tried to fill in the implementation but does it incorrectly.
  // The implementation of `deploy` and `getPack` below is the corrected
  // implementation.

  // This file needs to be loaded after models are booted and attached to the
  // remote datasource, otherwise they will be over-ridden by the incorrect
  // implementation.

  function deploy(contentType, callback) {
    var url = this.getDeployEndpoint();
    var req = request.put(url, {headers: {'content-type': contentType}});
    req.on('response', function(rsp) {
      if (callback) callback(null, rsp);
      callback = null;
    });
    req.on('error', function(err) {
      if (callback) callback(err);
      callback = null;
    });
    return req;
  }
  ServerService.prototype.deploy = deploy;

  function getPack(callback) {
    var apiUrl = ServerService.app.get('apiUrl');
    var url = util.format('%s/services/%s/pack', apiUrl, this.id);
    var req = request.get(url);
    req.on('response', function(rsp) {
      if (callback) callback(null, rsp);
      callback = null;
    });
    req.on('error', function(err) {
      if (callback) callback(err);
      callback = null;
    });
  }
  ServerService.prototype.getPack = getPack;

  function refresh(callback) {
    ServerService.findById(this.id, callback);
  }
  ServerService.prototype.refresh = refresh;


  function getStatusSummary(callback) {
    var serviceInfo = {};
    serviceInfo.clientApiVersion = require('../../package.json').apiVersion;
    serviceInfo.env = this.env;
    serviceInfo.name = this.name;
    serviceInfo.id = this.id;

    this.instances(function(err, instances) {
      if (err) return callback(err);
      serviceInfo.instances = {};
      for (var i in instances) {
        if (!instances.hasOwnProperty(i)) continue;
        var instance = instances[i];
        if (!instance.containerVersionInfo)
          continue;
        var container = instance.containerVersionInfo.container || {};
        serviceInfo.instances[instance.id] = {
          version: container.version || 'N/A',
          apiVersion: container.apiVersion || 'N/A',
          port: instance.PMPort || 'N/A',
          restartCount: instance.restartCount || 0,
          agentVersion: instance.agentVersion || 'N/A',
          debuggerVersion: instance.debuggerVersion || 'N/A',
          nodeVersion: instance.containerVersionInfo.node || 'N/A',
          driverMeta: instance.containerVersionInfo.driverMeta || {},
          clusterSize: instance.setSize
        };
      }

      // Collect process information for each instance
      async.map(instances, collectProcesses, function(err, map) {
        if (err) return callback(err);
        serviceInfo.processes = [];
        for (var i in map) {
          if (!map.hasOwnProperty(i)) continue;
          if (!serviceInfo.instances[map[i].instanceId]) continue;
          serviceInfo.processes =
            serviceInfo.processes.concat(map[i].processes);
          serviceInfo.instances[map[i].instanceId].numProcesses =
            map[i].processes.length;
        }
        callback(null, serviceInfo);
      });
    });

    function collectProcesses(instance, callback) {
      var filter = {
        order: ['stopTime DESC', 'serviceInstanceId ASC', 'workerId ASC']
      };
      instance.processes(filter, function(err, processes) {
        if (err) return callback(err);
        return async.map(processes, setDisplayId, function(err, procs) {
          if (err) return callback(err);
          callback(null, {
            instanceId: instance.id,
            processes: procs,
          });
        });

        function setDisplayId(process, callback) {
          process.displayId = util.format('%s.%s.%s',
            instance.serverServiceId, instance.executorId, process.pid);
          callback(null, process);
        }
      });
    }
  }
  ServerService.prototype.getStatusSummary = getStatusSummary;

  function npmModuleList(callback) {
    this.instances({limit: 1}, function(err, insts) {
      if (err) return callback(err);
      if (insts.length !== 1) return callback(Error('Unable to find instance'));
      var instance = insts[0];
      instance.npmModuleList(callback);
    });
  }
  ServerService.prototype.npmModuleList = npmModuleList;


};
