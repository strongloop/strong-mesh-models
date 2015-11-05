module.exports = function(ServiceInstance) {
  ServiceInstance.remoteMethod(
    'statusSummary',
    {
      http: {path: '/status', verb: 'get'},
      isStatic: false,
      accepts: [],
      returns: {arg: 'status', type: 'object', root: true},
      description: 'Retrieve a summary status of the instance',
    }
  );

  ServiceInstance.remoteMethod(
    'start',
    {
      http: {path: '/start', verb: 'post'},
      isStatic: false,
      accepts: [],
      returns: {arg: 'response', type: 'object', root: true},
      description: 'Start the application on the instance.',
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
          http: {source: 'body'},
        },
      ],
      returns: {arg: 'response', type: 'object', root: true},
      description: 'Stop the application on the instance.',
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
          http: {source: 'body'},
        },
      ],
      returns: {arg: 'response', type: 'object', root: true},
      description: 'Restart the application on the instance.',
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
          http: {source: 'body'},
        },
      ],
      returns: {arg: 'response', type: 'object', root: true},
      description: 'Set cluster size to N workers.',
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
          http: {source: 'body'},
        },
      ],
      returns: {arg: 'response', type: 'object', root: true},
      description: 'Start tracking objects on a worker.',
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
          http: {source: 'body'},
        },
      ],
      returns: {arg: 'response', type: 'object', root: true},
      description: 'Stop tracking objects on a worker.',
    }
  );

  ServiceInstance.remoteMethod(
    'tracingStart',
    {
      http: {path: '/tracingStart', verb: 'post'},
      isStatic: false,
      returns: {arg: 'response', type: 'object', root: true},
      description: 'Restart all workers with tracing on.',
    }
  );

  ServiceInstance.remoteMethod(
    'tracingStop',
    {
      http: {path: '/tracingStop', verb: 'post'},
      isStatic: false,
      returns: {arg: 'response', type: 'object', root: true},
      description: 'Restart all workers with tracing off.',
    }
  );

  ServiceInstance.remoteMethod(
    'npmModuleList',
    {
      http: {path: '/npmModuleList', verb: 'post'},
      isStatic: false,
      accepts: [],
      returns: {arg: 'response', type: 'object', root: true},
      description: 'List npm modules',
    }
  );

  ServiceInstance.remoteMethod(
    'agentTraces',
    {
      http: {path: '/processes/:pk/agentTraces', verb: 'get'},
      isStatic: false,
      accepts: [
        {
          arg: 'pk',
          required: true,
          type: 'number',
          http: {source: 'path'},
        },
      ],
      returns: {arg: 'agentTraces', type: '[AgentTrace]', root: true},
      description: 'Get all agent traces for a process under this instance',
    }
  );

  ServiceInstance.remoteMethod(
    'expressUsageRecords',
    {
      http: {path: '/processes/:pk/expressUsageRecords', verb: 'get'},
      isStatic: false,
      accepts: [
        {
          arg: 'pk',
          required: true,
          type: 'number',
          http: {source: 'path'},
        },
      ],
      returns: {
        arg: 'expressUsageRecords',
        type: '[ExpressUsageRecord]',
        root: true,
      },
      description:
        'Get all ExpressUsageRecords for a process under this instance',
    }
  );

  ServiceInstance.remoteMethod(
    'serviceMetrics',
    {
      http: {path: '/processes/:pk/serviceMetrics', verb: 'get'},
      isStatic: false,
      accepts: [
        {
          arg: 'pk',
          required: true,
          type: 'number',
          http: {source: 'path'},
        },
      ],
      returns: {arg: 'serviceMetrics', type: '[ServiceMetric]', root: true},
      description: 'Get all ServiceMetrics for a process under this instance',
    }
  );

  ServiceInstance.remoteMethod(
    'getMetaTransactions',
    {
      http: {path: '/processes/:pk/getMetaTransactions', verb: 'get'},
      isStatic: false,
      accepts: [
        {
          arg: 'pk',
          required: true,
          type: 'number',
          http: {source: 'path'},
        },
      ],
      returns: {arg: 'metaTransactions', type: ['string'], root: true},
      description: 'Retrieve a list of transaction endpoints',
    }
  );

  ServiceInstance.remoteMethod(
    'getTransaction',
    {
      http: {
        path: '/processes/:pk/getTransaction/:metaTransactionId',
        verb: 'get',
      },
      isStatic: false,
      accepts: [
        {
          arg: 'pk',
          required: true,
          type: 'number',
          http: {source: 'path'},
        },
        {
          arg: 'metaTransactionId',
          required: true,
          type: 'string',
          http: {source: 'path'},
        },
      ],
      returns: {arg: 'transaction', type: 'object', root: true},
      description: 'Retrieve transaction data',
    }
  );

  ServiceInstance.remoteMethod(
    'getTimeline',
    {
      http: {path: '/processes/:pk/getTimeline/', verb: 'get'},
      isStatic: false,
      accepts: [
        {
          arg: 'pk',
          required: true,
          type: 'number',
          http: {source: 'path'},
        },
      ],
      returns: {arg: 'timeline', type: 'object', root: true},
      description: 'Retrieve time line data',
    }
  );

  ServiceInstance.remoteMethod(
    'getTrace',
    {
      http: {path: '/processes/:pk/getTrace/:pfKey', verb: 'get'},
      isStatic: false,
      accepts: [
        {
          arg: 'pk',
          required: true,
          type: 'number',
          http: {source: 'path'},
        },
        {
          arg: 'pfKey',
          required: true,
          type: 'string',
          http: {source: 'path'},
        },
      ],
      returns: {arg: 'trace', type: 'object', root: true},
      description: 'Retrieve trace data for a profile key (pfKey)',
    }
  );

  ServiceInstance.remoteMethod(
    'stopObjectTracking',
    {
      http: {path: '/processes/:pk/stopObjectTracking', verb: 'post'},
      isStatic: false,
      accepts: [
        {
          arg: 'pk',
          required: true,
          type: 'number',
          http: {source: 'path'},
        },
      ],
      returns: {arg: 'response', type: 'object', root: true},
      description: 'Stop tracking objects on a process.',
    }
  );

  ServiceInstance.remoteMethod(
    'startObjectTracking',
    {
      http: {path: '/processes/:pk/startObjectTracking', verb: 'post'},
      isStatic: false,
      accepts: [
        {
          arg: 'pk',
          required: true,
          type: 'number',
          http: {source: 'path'},
        },
      ],
      returns: {arg: 'response', type: 'object', root: true},
      description: 'Start tracking objects on a process.',
    }
  );

  ServiceInstance.remoteMethod(
    'startCpuProfiling',
    {
      http: {path: '/processes/:pk/startCpuProfiling', verb: 'post'},
      isStatic: false,
      accepts: [
        {
          arg: 'pk',
          required: true,
          type: 'number',
          http: {source: 'path'},
        }, {
          arg: 'options',
          required: false,
          type: 'object',
          http: {source: 'body'},
          root: true,
        },
      ],
      returns: {arg: 'response', type: 'object', root: true},
      description: 'Start CPU profiling on a process.',
    }
  );

  ServiceInstance.remoteMethod(
    'stopCpuProfiling',
    {
      http: {path: '/processes/:pk/stopCpuProfiling', verb: 'post'},
      isStatic: false,
      accepts: [
        {
          arg: 'pk',
          required: true,
          type: 'number',
          http: {source: 'path'},
        },
      ],
      returns: {arg: 'response', type: 'object', root: true},
      description: 'Stop CPU profiling on a process.',
    }
  );

  ServiceInstance.remoteMethod(
    'heapSnapshot',
    {
      http: {path: '/processes/:pk/heapSnapshot', verb: 'post'},
      isStatic: false,
      accepts: [
        {
          arg: 'pk',
          required: true,
          type: 'number',
          http: {source: 'path'},
        },
      ],
      returns: {arg: 'response', type: 'object', root: true},
      description: 'Take a snapshot of the HEAP for a process.',
    }
  );

  ServiceInstance.remoteMethod(
    'queryCapabilities',
    {
      http: {path: '/processes/:pk/queryCapabilities/:feature', verb: 'get'},
      isStatic: false,
      accepts: [
        {
          arg: 'pk',
          required: true,
          type: 'number',
          http: {source: 'path'},
        }, {
          arg: 'feature',
          required: true,
          type: 'string',
          http: {source: 'path'},
        },
      ],
      returns: {arg: 'response', type: 'object', root: true},
      description: 'Check support for the specified feature (feature).',
    }
  );

  ServiceInstance.remoteMethod(
    'queryCapabilitiesAll',
    {
      http: {path: '/processes/:pk/queryCapabilities/', verb: 'get'},
      isStatic: false,
      accepts: [
        {
          arg: 'pk',
          required: true,
          type: 'number',
          http: {source: 'path'},
        },
      ],
      returns: {arg: 'response', type: 'object', root: true},
      description: 'Returns all capabilities which are supported.',
    }
  );

  ServiceInstance.remoteMethod(
    'applyPatch',
    {
      http: {path: '/processes/:pk/applyPatch', verb: 'post'},
      isStatic: false,
      accepts: [
        {
          arg: 'pk',
          required: true,
          type: 'number',
          http: {source: 'path'},
        }, {
          arg: 'patchData',
          required: true,
          type: 'object',
          http: {source: 'body'},
          root: true,
        },
      ],
      returns: {arg: 'response', type: 'object', root: true},
      description: 'Take a snapshot of the HEAP for a process.',
    }
  );

  ServiceInstance.remoteMethod(
    'startDebugger',
    {
      http: {path: '/processes/:pk/debugger/start', verb: 'post'},
      isStatic: false,
      accepts: [
        {
          arg: 'pk',
          required: true,
          type: 'number',
          http: {source: 'path'},
        },
      ],
      returns: {arg: 'response', type: 'object', root: true},
      description: 'Start DevTools Debugger backend on a worker.',
    }
  );

  ServiceInstance.remoteMethod(
    'stopDebugger',
    {
      http: {path: '/processes/:pk/debugger/stop', verb: 'post'},
      isStatic: false,
      accepts: [
        {
          arg: 'pk',
          required: true,
          type: 'number',
          http: {source: 'path'},
        },
      ],
      returns: {arg: 'response', type: 'object', root: true},
      description: 'Stop DevTools Debugger backend on a worker.',
    }
  );
};
