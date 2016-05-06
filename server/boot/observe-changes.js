// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: strong-mesh-models
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

var _ = require('lodash');
var debug = require('debug')('strong-mesh-models:server:observe-changes');

module.exports = function observeChanges(server) {
  var ServiceInstance = server.models.ServiceInstance;
  var ServiceProcess = server.models.ServiceProcess;
  var ServerService = server.models.ServerService;

  ServiceInstance.observe('after save', function(ctx, next) {
    var inst = ctx.instance || ctx.data;
    ServerService.__changeEmitter.emit('svc-' + inst.serverServiceId, {
      target: 'ServiceInstance-' + inst.id,
      type: ctx.isNewInstance ? 'create' : 'update',
      data: _.pick(inst.toObject(), [
        'serverServiceId',
        'groupId',
        'startTime',
        'stopTime',
        'restartCount',
        'started',
        'setSize',
        'cpus',
        'tracingEnabled',
        'applicationName',
        'npmModules',
        'agentVersion',
        'debuggerVersion',
        'id',
      ]),
      optimistic: false,
    });
    setImmediate(next);
  });

  ServiceProcess.observe('after save', function(ctx, next) {
    var proc = ctx.instance || ctx.data;
    ServiceInstance.findById(proc.serviceInstanceId, function(err, instance) {
      if (err) {
        debug('Unable to locate instnce for proc %j', proc);
        return next(err);
      }
      proc.serverServiceId = instance.serverServiceId;
      ServerService.__changeEmitter.emit('svc-' + proc.serverServiceId, {
        target: 'ServiceProcess-' + proc.id,
        type: ctx.isNewInstance ? 'create' : 'update',
        data: proc.toObject(),
        optimistic: false,
      });
      setImmediate(next);
    });
  });
};
