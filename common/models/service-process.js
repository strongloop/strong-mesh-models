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
};
