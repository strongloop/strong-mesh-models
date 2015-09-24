var assert = require('assert');
var async = require('async');
var debug = require('debug')('strong-mesh-models:service-manager');
var instModelWatcher = require('../../lib/helper').instModelWatcher;
var shouldWatch = require('../../lib/helper').shouldWatch;

module.exports = function(Executor) {

  // Refer to server-service.js for description of instance vs currentInstance
  // vs data.

  var name = 'executor';

  Executor.observe('after save', function(ctx, next) {
    var serviceManager = Executor.app.serviceManager;
    debug('------------------ Executor SAVE %j.', ctx.where);

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
        'deleteFun': deleteObserver,
        'modelInst': serviceManager._meshApp.models.Executor,
      };
      instModelWatcher(watcherCtx);
    }
    saveObserver(ctx, next);
  });

  Executor.observe('before delete', function(ctx, next) {
    var serviceManager = Executor.app.serviceManager;
    debug('------------------ Executor DELETE %j.', ctx.where);
    if (serviceManager._dbWatcher) {
      assert(!shouldWatch(serviceManager, name, next));
      setImmediate(next);
      return;
    }
    deleteObserver(ctx, next);
  });

  function saveObserver(ctx, next) {
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

  }

  function deleteObserver(ctx, next) {
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
  }

  Executor.prototype.shutdown = function(callback) {
    Executor.app.serviceManager.onExecutorRequest(
      this.id, {cmd: 'shutdown'}, callback);
  };
};
