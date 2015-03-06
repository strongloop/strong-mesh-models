var debug = require('debug')('strong-mesh-models:server:express-usage');
var deleteOld = require('./delete-old');

module.exports = function extendExpressUsageRecord(ExpressUsageRecord) {
  function recordUsage(instanceId, req, callback) {
    debug('Express usage record: %j', req.record);
    var ServiceProcess = ExpressUsageRecord.app.models.ServiceProcess;
    var record = req.record;
    var pid = +record.process.pid;

    var q = {where: {
      serviceInstanceId: instanceId,
      pid: pid,
      stopTime: null
    }};

    ServiceProcess.findOne(q, function(err, proc) {
      if (err) return callback(err);
      if (!proc) {
        debug('Ignoring metrics for unknown worker pid: %d', pid);
        return callback();
      }

      var usageRecord = {
        processId: proc.id,
        workerId: proc.workerId,
        timeStamp: record.timestamp,
        detail: record
      };

      ExpressUsageRecord.create(usageRecord, function(err) {
        if (err) return callback(err);
        deleteOld(ExpressUsageRecord, callback);
      });
    });
  }
  ExpressUsageRecord.recordUsage = recordUsage;
};
