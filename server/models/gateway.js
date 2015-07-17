var async = require('async');

module.exports = function extendGateway(Gateway) {
  // Refer to server-service.js for description of instance vs currentInstance
  // vs data.

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
  });

  Gateway.observe('before delete', function(ctx, next) {
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
