module.exports = function extendServiceProcess(ServiceProcess) {
  ServiceProcess.remoteMethod(
    'getMetaTransactions',
    {
      http: {path: '/getMetaTransactions', verb: 'get'},
      isStatic: false,
      returns: {arg: 'metaTransactions', type: ['string'], root: true},
      description: 'Retrieve a list of transaction endpoints'
    }
  );

  ServiceProcess.remoteMethod(
    'getTransaction',
    {
      http: {path: '/getTransaction/:metaTransactionId', verb: 'get'},
      isStatic: false,
      accepts: [
        {
          arg: 'metaTransactionId',
          required: true,
          type: 'string',
          http: {source: 'path'}
        }
      ],
      returns: {arg: 'transaction', type: 'object', root: true},
      description: 'Retrieve transaction data'
    }
  );

  ServiceProcess.remoteMethod(
    'getTimeline',
    {
      http: {path: '/getTimeline/', verb: 'get'},
      isStatic: false,
      accepts: [],
      returns: {arg: 'timeline', type: 'object', root: true},
      description: 'Retrieve time line data'
    }
  );

  ServiceProcess.remoteMethod(
    'getTrace',
    {
      http: {path: '/getTrace/:pfKey', verb: 'get'},
      isStatic: false,
      accepts: [
        {
          arg: 'pfKey',
          required: true,
          type: 'string',
          http: {source: 'path'}
        }
      ],
      returns: {arg: 'trace', type: 'object', root: true},
      description: 'Retrieve trace data for a profile key (pfKey)'
    }
  );

  ServiceProcess.remoteMethod(
    'stopObjectTracking',
    {
      http: {path: '/stopObjectTracking', verb: 'post'},
      isStatic: false,
      accepts: [],
      returns: {arg: 'response', type: 'object', root: true},
      description: 'Stop tracking objects on a process.'
    }
  );

  ServiceProcess.remoteMethod(
    'startObjectTracking',
    {
      http: {path: '/startObjectTracking', verb: 'post'},
      isStatic: false,
      accepts: [],
      returns: {arg: 'response', type: 'object', root: true},
      description: 'Start tracking objects on a process.'
    }
  );

  ServiceProcess.remoteMethod(
    'startCpuProfiling',
    {
      http: {path: '/startCpuProfiling', verb: 'post'},
      isStatic: false,
      accepts: [{
        arg: 'options',
        required: false,
        type: 'object',
        http: {source: 'body'},
        root: true,
      }],
      returns: {arg: 'response', type: 'object', root: true},
      description: 'Start CPU profiling on a process.'
    }
  );

  ServiceProcess.remoteMethod(
    'stopCpuProfiling',
    {
      http: {path: '/stopCpuProfiling', verb: 'post'},
      isStatic: false,
      accepts: [],
      returns: {arg: 'response', type: 'object', root: true},
      description: 'Stop CPU profiling on a process.'
    }
  );

  ServiceProcess.remoteMethod(
    'heapSnapshot',
    {
      http: {path: '/heapSnapshot', verb: 'post'},
      isStatic: false,
      accepts: [],
      returns: {arg: 'response', type: 'object', root: true},
      description: 'Take a snapshot of the HEAP for a process.'
    }
  );

  ServiceProcess.remoteMethod(
    'queryCapabilities',
    {
      http: {path: '/queryCapabilities/:feature', verb: 'get'},
      isStatic: false,
      accepts: [{
        arg: 'feature',
        required: true,
        type: 'string',
        http: {source: 'path'}
      }],
      returns: {arg: 'response', type: 'object', root: true},
      description: 'Check support for the specified feature (feature).'
    }
  );

  ServiceProcess.remoteMethod(
    'queryCapabilitiesAll',
    {
      http: {path: '/queryCapabilities/', verb: 'get'},
      isStatic: false,
      accepts: [],
      returns: {arg: 'response', type: 'object', root: true},
      description: 'Returns all capabilities which are supported.'
    }
  );

  ServiceProcess.remoteMethod(
    'applyPatch',
    {
      http: {path: '/applyPatch', verb: 'post'},
      isStatic: false,
      accepts: [{
        arg: 'patchData',
        required: true,
        type: 'object',
        http: {source: 'body'},
        root: true,
      }],
      returns: {arg: 'response', type: 'object', root: true},
      description: 'Take a snapshot of the HEAP for a process.'
    }
  );

  ServiceProcess.remoteMethod(
    'startDebugger',
    {
      http: {path: '/debugger/start', verb: 'post'},
      isStatic: false,
      accepts: [],
      returns: {arg: 'response', type: 'object', root: true},
      description: 'Start DevTools Debugger backend on a worker.'
    }
  );

  ServiceProcess.remoteMethod(
    'stopDebugger',
    {
      http: {path: '/debugger/stop', verb: 'post'},
      isStatic: false,
      accepts: [],
      returns: {arg: 'response', type: 'object', root: true},
      description: 'Stop DevTools Debugger backend on a worker.'
    }
  );
};
