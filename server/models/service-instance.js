var async = require('async');
var debug = require('debug')('strong-mesh-models:server:service-instance');

module.exports = function extendServiceInstance(ServiceInstance) {
  ServiceInstance.beforeRemote(
    'prototype.updateAttributes',
    function(ctx, _, next) {
      debug('updateAttributes with %j', ctx.args.data);
      // When updating the instance via REST, only allow changes to cpus
      ctx.args.data = {
        cpus: ctx.args.data.cpus
      };
      next();
    }
  );

  ServiceInstance.observe('before save', function beforeUpdate(ctx, next) {
    if (ctx.instance) {
      // create or full update of instance model
      if (isNaN(parseInt(ctx.instance.cpus, 10))) {
        ctx.instance.cpus = 'CPU';
      }
    } else if (ctx.data && ctx.data.cpus &&
      isNaN(parseInt(ctx.data.cpus, 10))) {
      ctx.data.cpus = 'CPU';
    }
    next();
  });

  // For save, the manager is notified after the model has  been persisted in
  // DB so that queries on the DB will return correct information. Similarly
  // for delete, the manager is notified before the model has been deleted from
  // the DB, so that queries will return information.
  ServiceInstance.observe('after save', function(ctx, next) {
    var serviceManager = ServiceInstance.app.serviceManager;
    if (ctx.instance) {
      // Full save of Instance (create)
      serviceManager.onInstanceUpdate(ctx.instance, next);
    } else {
      // Save of multiple Services
      ServiceInstance.find(ctx.where, function(err, services) {
        if (err) return next(err);
        return async.each(
          services,
          function(instance, callback) {
            serviceManager.onInstanceUpdate(instance, callback);
          },
          next
        );
      });
    }
  });

  ServiceInstance.observe('before delete', function(ctx, next) {
    var serviceManager = ServiceInstance.app.serviceManager;

    ctx.Model.find(ctx.where, function(err, instances) {
      if (err) next(err);
      return async.each(
        instances,
        function(instance, callback) {
          serviceManager.onInstanceDestroy(instance, callback);
        },
        next
      );
    });
  });

  function recordInstanceInfo(instanceId, instInfo, callback) {
    ServiceInstance.findById(instanceId, function(err, instance) {
      if (err) return callback(err);
      instance.currentDeploymentId = instInfo.commitHash;
      instance.startTime = new Date();
      instance.started = true;
      instance.applicationName = instInfo.appName;
      instance.npmModules = instInfo.npmModules;
      instance.PMPort = instInfo.PMPort;
      instance.containerVersionInfo = instInfo.containerVersionInfo;
      instance.setSize = instInfo.setSize;
      instance.agentVersion = instInfo.agentVersion;
      instance.restartCount = instInfo.restartCount;
      instance.save(callback);
    });
  }
  ServiceInstance.recordInstanceInfo = recordInstanceInfo;

  // Only allow updating ServiceInstance
  ServiceInstance.disableRemoteMethod('create', true);
  ServiceInstance.disableRemoteMethod('upsert', true);
  ServiceInstance.disableRemoteMethod('deleteById', true);
  ServiceInstance.disableRemoteMethod('deleteAll', true);
};
