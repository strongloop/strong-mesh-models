var debug = require('debug')('strong-mesh-models:common:service');

module.exports = function(Service) {
  Service.beforeRemote(
    'create',
    function(ctx, _, next) {
      debug('create with %j', ctx.args.data);
      // When updating the instance via REST, dont allow changes to startTime
      // or deploymentInfo
      delete ctx.args.data.deploymentInfo;
      delete ctx.args.data.startTime;
      next();
    }
  );

  Service.setup = function() {
    Service.base.setup.call(this);

    this.remoteMethod('deploy', {
      isStatic: false,
      http: [
        {path: '/deploy/*', verb: 'get'},
        {path: '/deploy/*', verb: 'post'},
        {path: '/deploy/*', verb: 'put'},
        {path: '/deploy', verb: 'get'},
        {path: '/deploy', verb: 'post'},
        {path: '/deploy', verb: 'put'},
      ],
      accepts: {arg: 'ctx', http: {source: 'context'}},
      description: 'Deploy service'
    });

    this.remoteMethod('setEnv', {
      isStatic: false,
      http: {path: '/env/:name', verb: 'put'},
      accepts: [
        {arg: 'name', type: 'string', http: {source: 'path'}},
        {arg: 'value', required: true, type: 'string', http: {source: 'body'}}
      ],
      returns: {arg: 'env', type: 'object'},
      description: 'Set environment variables'
    });

    this.remoteMethod('unsetEnv', {
      isStatic: false,
      http: {path: '/env/:name', verb: 'delete'},
      accepts: [
        {arg: 'name', required: true, type: 'string', http: {source: 'path'}},
      ],
      returns: {arg: 'env', type: 'object'},
      description: 'Unset environment variables'
    });

    this.remoteMethod('getPack', {
      isStatic: false,
      http: [
        {path: '/pack', verb: 'get'}
      ],
      accepts: {arg: 'ctx', http: {source: 'context'}}
    });

    this.remoteMethod('downloadProfile', {
      isStatic: false,
      http: {path: '/profileDatas/:profileId/download', verb: 'get'},
      accepts: [
        {arg: 'ctx', http: {source: 'context'}}
      ],
      description: 'Download service profiling information'
    });

    this.disableRemoteMethod('__delete__actions');
    this.disableRemoteMethod('__destroyById__actions');
    this.disableRemoteMethod('__updateById__actions');

    this.disableRemoteMethod('__delete__instances');
    this.disableRemoteMethod('__create__instances');
    this.disableRemoteMethod('__destroyById__instances');
    this.disableRemoteMethod('__updateById__instances');

    this.disableRemoteMethod('__delete__executors');
    this.disableRemoteMethod('__create__executors');
    this.disableRemoteMethod('__destroyById__executors');
    this.disableRemoteMethod('__updateById__executors');
    this.disableRemoteMethod('__unlink__executors');
    this.disableRemoteMethod('__link__executors');
    this.disableRemoteMethod('__exists__executors');

    this.disableRemoteMethod('__delete__profileDatas');
    this.disableRemoteMethod('__create__profileDatas');
    this.disableRemoteMethod('__destroyById__profileDatas');
    this.disableRemoteMethod('__updateById__profileDatas');

    this.disableRemoteMethod('__delete__groups');
    this.disableRemoteMethod('__create__groups');
    this.disableRemoteMethod('__destroyById__groups');
    this.disableRemoteMethod('__updateById__groups');
  };
};
