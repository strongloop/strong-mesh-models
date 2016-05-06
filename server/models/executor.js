// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: strong-mesh-models
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

var async = require('async');
var genToken = require('../util').genToken;
var observerHelper = require('./observerHelper');

module.exports = function(Executor) {
  observerHelper(Executor);

  Executor.observe('before save', function(ctx, callback) {
    if (ctx.instance) {
      if (!ctx.instance.token) ctx.instance.token = genToken();
    } else {
      if (!ctx.data.token) ctx.data.token = genToken();
    }
    callback();
  });

  Executor.observe('after save', saveObserver);
  Executor.observe('before delete', deleteObserver);

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
