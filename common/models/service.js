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
      accepts: [
        {arg: 'req', http: {source: 'req'}},
        {arg: 'res', http: {source: 'res'}}
      ],
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

    this.remoteMethod('setEnvs', {
      isStatic: false,
      http: {path: '/env/', verb: 'put'},
      accepts: [
        {
          arg: 'env',
          required: true,
          type: 'object',
          http: {source: 'body'},
          root: true,
          description: 'Key-value describing environment variables to add. ' +
            'A null value causes the variable to be removed',
        }
      ],
      returns: {arg: 'env', type: 'object'},
      description: 'Set multiple environment variables.'
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

    this.remoteMethod('downloadProfile', {
      isStatic: false,
      http: {path: '/profileDatas/:profileId/download', verb: 'get'},
      accepts: [
        {arg: 'ctx', http: {source: 'context'}}
      ],
      description: 'Download service profiling information'
    });

    this.remoteMethod(
      'start',
      {
        http: {path: '/start', verb: 'post'},
        isStatic: false,
        accepts: [],
        returns: {arg: 'response', type: 'object', root: true},
        description: 'Start the application on the instance.'
      }
    );

    this.remoteMethod(
      'stop',
      {
        http: {path: '/stop', verb: 'post'},
        isStatic: false,
        accepts: [
          {
            arg: 'options',
            required: true,
            type: 'object',
            http: {source: 'body'}
          }
        ],
        returns: {arg: 'response', type: 'object', root: true},
        description: 'Stop the application on the instance.'
      }
    );

    this.remoteMethod(
      'restart',
      {
        http: {path: '/restart', verb: 'post'},
        isStatic: false,
        accepts: [
          {
            arg: 'options',
            required: true,
            type: 'object',
            http: {source: 'body'}
          }
        ],
        returns: {arg: 'response', type: 'object', root: true},
        description: 'Restart the application on the instance.'
      }
    );

    this.remoteMethod(
      'logDump',
      {
        http: {path: '/logs', verb: 'post'},
        isStatic: false,
        accepts: [],
        returns: {arg: 'response', type: 'object', root: true},
        description: 'Retrieve logs for the application.'
      }
    );

    this.remoteMethod(
      'setClusterSize',
      {
        http: {path: '/setClusterSize', verb: 'post'},
        isStatic: false,
        accepts: [
          {
            arg: 'size',
            required: true,
            type: 'any',
          }, {
            arg: 'persist',
            required: true,
            type: 'boolean',
          }
        ],
        returns: {arg: 'response', type: 'object', root: true},
        description: 'Set cluster size'
      }
    );

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

    this.disableRemoteMethod('__create__profileDatas');
    this.disableRemoteMethod('__updateById__profileDatas');

    this.disableRemoteMethod('__delete__groups');
    this.disableRemoteMethod('__create__groups');
    this.disableRemoteMethod('__destroyById__groups');
    this.disableRemoteMethod('__updateById__groups');
  };
};
