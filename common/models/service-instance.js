module.exports = function(ServiceInstance) {
  ServiceInstance.remoteMethod(
    'statusSummary',
    {
      http: {path: '/status', verb: 'get'},
      isStatic: false,
      accepts: [],
      returns: {arg: 'status', type: 'object', root: true},
      description: 'Retrieve a summary status of the instance'
    }
  );

  ServiceInstance.remoteMethod(
    'start',
    {
      http: {path: '/start', verb: 'post'},
      isStatic: false,
      accepts: [],
      returns: {arg: 'response', type: 'object', root: true},
      description: 'Start the application on the instance.'
    }
  );

  ServiceInstance.remoteMethod(
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

  ServiceInstance.remoteMethod(
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

  ServiceInstance.remoteMethod(
    'clusterSizeSet',
    {
      http: {path: '/resizeCluster', verb: 'post'},
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
      description: 'Set cluster size to N workers.'
    }
  );

  ServiceInstance.remoteMethod(
    'objectTrackingStart',
    {
      http: {path: '/objectTrackingStart', verb: 'post'},
      isStatic: false,
      accepts: [
        {
          arg: 'target',
          required: true,
          type: 'string',
          http: {source: 'body'}
        }
      ],
      returns: {arg: 'response', type: 'object', root: true},
      description: 'Start tracking objects on a worker.'
    }
  );

  ServiceInstance.remoteMethod(
    'objectTrackingStop',
    {
      http: {path: '/objectTrackingStop', verb: 'post'},
      isStatic: false,
      accepts: [
        {
          arg: 'target',
          required: true,
          type: 'string',
          http: {source: 'body'}
        }
      ],
      returns: {arg: 'response', type: 'object', root: true},
      description: 'Stop tracking objects on a worker.'
    }
  );

  ServiceInstance.remoteMethod(
    'npmModuleList',
    {
      http: {path: '/npmModuleList', verb: 'post'},
      isStatic: false,
      accepts: [],
      returns: {arg: 'response', type: 'object', root: true},
      description: 'List npm modules'
    }
  );
};
