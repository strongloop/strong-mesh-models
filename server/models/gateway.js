var async = require('async');
var genToken = require('../util').genToken;
var observerHelper = require('./observerHelper');

module.exports = function extendGateway(Gateway) {
  Gateway.definition.properties.token.default = genToken;
  observerHelper(Gateway);

  Gateway.observe('after save', saveObserver);
  Gateway.observe('before delete', deleteObserver);

  function saveObserver(ctx, next) {
    var serviceManager = Gateway.app.serviceManager;

    // Refer to server-service.js for description of instance vs currentInstance
    // vs data.
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
    var serviceManager = Gateway.app.serviceManager;
    if (ctx.instance) {
      serviceManager.onGatewayDestroy(ctx.instance, next);
    } else {
      Gateway.find({where: ctx.where}, function(err, instances) {
        if (err) next(err);
        return async.each(
          instances,
          function(instance, callback) {
            serviceManager.onGatewayDestroy(instance, callback);
          },
          next
        );
      });
    }
  }

};
