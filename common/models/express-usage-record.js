var g = require('strong-globalize');

module.exports = function expressUsageRecord(ExpressUsageRecord) {
  ExpressUsageRecord.remoteMethod('dailySummary', {
    isStatic: true,
    http: {path: '/dailySummary', verb: 'get'},
    accepts: [],
    returns: {arg: 'summary', type: 'object', root: true},
    description: g.t('Daily summary by endpoint'),
  });

  ExpressUsageRecord.remoteMethod('hourlySummary', {
    isStatic: true,
    http: {path: '/hourlySummary', verb: 'get'},
    accepts: [
      {
        arg: 'modelOrUri',
        required: true,
        type: 'string',
      },
    ],
    returns: {arg: 'summary', type: 'object', root: true},
    description: g.t('Number of calls to endpoint/method summarized ' +
      'by hour for one day'),
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
    returns: {arg: 'summary', type: 'object', root: true},
    description: g.t('Endpoint details for one hour'),
  });
};
