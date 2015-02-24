var debug = require('debug')('strong-pm:service-instance');
var runConfig = require('../config');
var util = require('util');

module.exports = function(ServiceInstance) {
  ServiceInstance.beforeRemote(
    'prototype.updateAttributes',
    function(ctx, _, next) {
      debug('updateAttributes with %j', ctx.args.data);
      // When updating the instance via REST, only allow changes to cpus
      ctx.args.data = {
        cpus: ctx.args.data['cpus']
      };
      next();
    }
  );

  ServiceInstance.observe('before save', function beforeUpdate(ctx, next) {
    if (ctx.instance) {
      // create or full update of instance model
      if (isNaN(parseInt(ctx.instance.cpus))) {
        ctx.instance.cpus = 'CPU';
      }
    } else {
      // update of multiple models
      if (ctx.data && ctx.data.cpus && isNaN(parseInt(ctx.data.cpus))) {
        ctx.data.cpus = 'CPU';
      }
    }
    next();
  });

  // Only allow updating ServiceInstance
  //ServiceInstance.disableRemoteMethod('create', true);
  ServiceInstance.disableRemoteMethod('upsert', true);
  ServiceInstance.disableRemoteMethod('deleteById', true);
  ServiceInstance.disableRemoteMethod('deleteAll', true);
};
