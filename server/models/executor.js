var assert = require('assert');
var async = require('async');
var instModelWatcher = require('../../lib/helper').instModelWatcher;
var shouldWatch = require('../../lib/helper').shouldWatch;

module.exports = function(Executor) {

  // Refer to server-service.js for description of instance vs currentInstance
  // vs data.

  var name = 'executor';

  Executor.observe('after save', function(ctx, next) {
    var serviceManager = Executor.app.serviceManager;
    var instance = ctx.instance || ctx.currentInstance;

    if (instance) {
      if (serviceManager.onExecutorUpdate.length === 2) {
        serviceManager.onExecutorUpdate(instance, next);
      } else {
        serviceManager.onExecutorUpdate(instance, ctx.isNewInstance, next);
      }
    } else {
      // Save of multiple Services
      Executor.find({where: ctx.where}, function(err, executors) {
        if (err) return next(err);
        return async.each(
          executors,
          function(executor, callback) {
            if (serviceManager.onExecutorUpdate.length === 2) {
              serviceManager.onExecutorUpdate(executor, callback);
            } else {
              serviceManager.onExecutorUpdate(executor, false, callback);
            }
          },
          next
        );
      });
    }

    if (shouldWatch(serviceManager, name)) {
      var watcherCtx = {
        'modelName': name,
        'watcher': serviceManager._dbWatcher,
        'onUpdate': serviceManager.onExecutorUpdate,
        'onDestroy': serviceManager.onExecutorDestroy,
        'modelInst': serviceManager._meshApp.models.Executor,
      };
      instModelWatcher(watcherCtx);
    }

  });

  Executor.observe('before delete', function(ctx, next) {
    var serviceManager = Executor.app.serviceManager;
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
          Executor.app.serviceManager.onExecutorDestroy(instance, callback);
        },
        next
      );
    });
  });

  Executor.prototype.shutdown = function(callback) {
    Executor.app.serviceManager.onExecutorRequest(
      this.id, {cmd: 'shutdown'}, callback);
  };
};
