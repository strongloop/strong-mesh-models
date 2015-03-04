var async = require('async');
var debug = require('debug')('strong-mesh-models:server:service-metric');
var deleteOld = require('./delete-old');

module.exports = function extendServiceMetric(ServiceMetric) {
  function recordMetrics(instanceId, req, callback) {
    debug('Process metrics: %j', req.metrics);
    var ServiceProcess = ServiceMetric.app.models.ServiceProcess;

    function saveMetric(wid, asyncCb) {
      var m = req.metrics.processes[wid];
      var q = {where: {
        serviceInstanceId: instanceId,
        workerId: +wid,
        stopTime: null
      }};
      ServiceProcess.findOne(q, function(err, proc) {
        if (err) return callback(err);
        if (!proc) {
          debug('Ignoring metrics for unknown worker: %d', wid);
          // Metrics can show up after process death, or perhaps even before
          // supervisor knows they have forked. The timing is a bit
          // uncertain, don't rely on it.
          return asyncCb();
        }
        m.processId = proc.id;
        m.workerId = wid;
        m.timeStamp = req.metrics.timestamp;
        ServiceMetric.upsert(m, asyncCb);
      });
    }

    return async.each(Object.keys(req.metrics.processes), saveMetric,
      function(err) {
        if (err) return callback(err);
        deleteOld(ServiceMetric, callback);
      }
    );
  }
  ServiceMetric.recordMetrics = recordMetrics;
};
