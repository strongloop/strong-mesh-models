var assert = require('assert');
var async = require('async');
var instModelWatcher = require('../../lib/helper').instModelWatcher;
var shouldWatch = require('../../lib/helper').shouldWatch;

module.exports = function extendGateway(Gateway) {
  // Refer to server-service.js for description of instance vs currentInstance
  // vs data.

  var name = 'gateway';

  Gateway.observe('after save', function(ctx, next) {
    var serviceManager = Gateway.app.serviceManager;
    var instance = ctx.instance || ctx.currentInstance;

    if (instance) {
      serviceManager.onGatewayUpdate(instance, ctx.isNewInstance, next);
    } else {
      // Save of multiple Services
      Gateway.find({where: ctx.where}, function(err, gateways) {
        if (err) return next(err);
        return async.each(
          gateways,
          function(gateway, callback) {
            serviceManager.onGatewayUpdate(gateway, false, callback);
          },
          next
        );
      });
    }

    if (shouldWatch(serviceManager, name)) {
      var watcherCtx = {
        'modelName': name,
        'watcher': serviceManager._dbWatcher,
        'onUpdate': serviceManager.onGatewayUpdate,
        'onDestroy': serviceManager.onGatewayDestroy,
        'modelInst': serviceManager._meshApp.models.Gateway,
      };
      instModelWatcher(watcherCtx);
    }

  });

  Gateway.observe('before delete', function(ctx, next) {
    var serviceManager = Gateway.app.serviceManager;
    if (serviceManager._dbMatcher) {
      assert(!shouldWatch(serviceManager, name));
      setImmediate(next);
      return;
    }
    ctx.Model.find({where: ctx.where}, function(err, instances) {
      if (err) next(err);
      return async.each(
        instances,
        function(instance, callback) {
          Gateway.app.serviceManager.onGatewayDestroy(instance, callback);
        },
        next
      );
    });
  });
};
