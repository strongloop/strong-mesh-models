var async = require('async');
var debug = require('debug')('strong-mesh-models:service-manager');
var instModelWatcher = require('../../lib/helper').instModelWatcher;
var shouldWatch = require('../../lib/helper').shouldWatch;

module.exports = function(Executor) {

  // Refer to server-service.js for description of instance vs currentInstance
  // vs data.

  var name = Executor.modelName.toLowerCase();

  console.trace('~~~~~~~~~ Executor.observe ~~~~~~~~~~~');
  Executor.observe('after save', function(ctx, next) {
    var serviceManager = Executor.app.serviceManager;
    if (serviceManager._dbWatcher) {
      if (!shouldWatch(serviceManager, name, next, 'save')) {
        setImmediate(next);
        return;
      }
      var watcherCtx = {
        'modelName': name,
        'watcher': serviceManager._dbWatcher,
        'saveFn': saveObserver,
        'deleteFn': deleteObserver,
        'modelInst': Executor,
        'Model': serviceManager._meshApp.models.ServiceInstance,
      };
      instModelWatcher(watcherCtx);
    }
    saveObserver(ctx, next);
  });

  Executor.observe('before delete', function(ctx, next) {
    var serviceManager = Executor.app.serviceManager;
    if (serviceManager._dbWatcher) {
      if (shouldWatch(serviceManager, name, next, 'delete'))
      setImmediate(next);
      return;
    }
    console.log('*************** calling DELETE observer from loopback:', name);
    deleteObserver(ctx, next);
  });

  function saveObserver(ctx, next) {
    console.trace('~~~~~~~~~~ Executor saveObserver ~~~~~~~~ ');
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
    console.trace('~~~~~~~~~~ Executor deleteObserver ~~~~~~~~ ');
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
