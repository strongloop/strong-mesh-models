var async = require('async');

module.exports = function(Executor) {
  Executor.observe('after save', function(ctx, next) {
    var serviceManager = Executor.app.serviceManager;
    if (ctx.instance) {
      if (serviceManager.onExecutorUpdate.length === 2) {
        serviceManager.onExecutorUpdate(ctx.instance, next);
      } else {
        serviceManager.onExecutorUpdate(ctx.instance, ctx.isNewInstance, next);
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
  });
};
