var async = require('async');
var genToken = require('../util').genToken;
var observerHelper = require('./observerHelper');

module.exports = function(Executor) {
  Executor.definition.properties.token.default = genToken;

  observerHelper(Executor, saveObserver, deleteObserver);

  function saveObserver(ctx, next) {
    var serviceManager = Executor.app.serviceManager;

    // Refer to server-service.js for description of instance vs currentInstance
    // vs data.
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
    var serviceManager = Executor.app.serviceManager;
    if (ctx.instance) {
      serviceManager.onExecutorDestroy(ctx.instance, next);
    } else {
      Executor.find({where: ctx.where}, function(err, instances) {
        if (err) next(err);
        return async.each(
          instances,
          function(instance, callback) {
            serviceManager.onExecutorDestroy(instance, callback);
          },
          next
        );
      });
    }
  }

  Executor.prototype.shutdown = function(callback) {
    Executor.app.serviceManager.onExecutorRequest(
      this.id, {cmd: 'shutdown'}, callback);
  };
};
