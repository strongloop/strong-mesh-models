module.exports = function expressUsageRecord(ExpressUsageRecord) {
  ExpressUsageRecord.remoteMethod('dailySummary', {
    isStatic: true,
    http: {path: '/dailySummary', verb: 'get'},
    accepts: [],
    returns: {arg: 'summary', type: 'object', root: true},
    description: 'Daily summary by endpoint'
  });

  ExpressUsageRecord.remoteMethod('hourlySummary', {
    isStatic: true,
    http: {path: '/hourlySummary', verb: 'get'},
    accepts: [
      {
        arg: 'modelOrUri',
        required: true,
        type: 'string',
      }, {
        arg: 'windowStartTime',
        required: true,
        type: 'date',
      }
    ],
    description: 'Hourly summary by endpoint and method'
  });

  ExpressUsageRecord.remoteMethod('endpointDetail', {
    isStatic: true,
    http: {path: '/endpointDetail', verb: 'get'},
    accepts: [
      {
        arg: 'modelOrUri',
        required: true,
        type: 'string',
      }, {
        arg: 'windowStartTime',
        required: true,
        type: 'date',
      }],
    description: 'Endpoint detail'
  });
};
