var assert = require('assert');
var async = require('async');
var debug = require('debug')('strong-mesh-models:service-manager');
var instModelWatcher = require('../../lib/helper').instModelWatcher;
var shouldWatch = require('../../lib/helper').shouldWatch;

module.exports = function extendGateway(Gateway) {
  // Refer to server-service.js for description of instance vs currentInstance
  // vs data.

  var name = 'gateway';

  Gateway.observe('after save', function(ctx, next) {
    var serviceManager = Gateway.app.serviceManager;

    debug('------------------ Gateway SAVE %j.', ctx.where);
    if (serviceManager._dbWatcher) {
      if (!shouldWatch(serviceManager, name)) {
        setImmediate(next);
        return;
      }
      var watcherCtx = {
        'modelName': name,
        'watcher': serviceManager._dbWatcher,
        'saveFun': saveObserver,
        'saveNext': next,
        'deletFune': deleteObserver,
        'modelInst': serviceManager._meshApp.models.Gateway,
      };
      instModelWatcher(watcherCtx);
    }
    saveObserver(ctx, next);
  });

  Gateway.observe('before delete', function(ctx, next) {
    var serviceManager = Gateway.app.serviceManager;
    debug('------------------ Gateway DELETE %j.', ctx.where);
    if (serviceManager._dbWatcher) {
      assert(!shouldWatch(serviceManager, name, next));
      setImmediate(next);
      return;
    }
    deleteObserver(ctx, next);
  });

  function saveObserver(ctx, next) {
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

  }

  function deleteObserver(ctx, next) {
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
  }

};
