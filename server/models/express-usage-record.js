var debug = require('debug')('strong-mesh-models:server:express-usage');
var deleteOld = require('./delete-old');
var url = require('url');

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
        detail: record.data || {},
      };

      if (record.request) {
        usageRecord.requestMethod = record.request.method || null;
        usageRecord.requestUrl = null;
        if (record.request.url)
          usageRecord.requestUrl = url.parse(record.request.url).path;
      }
      if (record.client) {
        usageRecord.clientAddress = record.client.address || null;
        usageRecord.clientUsername = record.client.username || null;
        usageRecord.clientId = record.client.id || null;
        usageRecord.clientDetail = record.client;
      }
      if (record.loopback) {
        usageRecord.lbModelName = record.loopback.modelName || null;
        usageRecord.lbInstanceId = record.loopback.instanceId || null;
        usageRecord.lbRemoteMethod = record.loopback.remoteMethod || null;
      }

      ExpressUsageRecord.create(usageRecord, function(err) {
        if (err) return callback(err);
        deleteOld(ExpressUsageRecord, callback);
      });
    });
  }
  ExpressUsageRecord.recordUsage = recordUsage;

  function dailySummary(callback) {
    ExpressUsageRecord.find({order: ['lbModelName', 'requestUrl']},
      function(err, records) {
        if (err) return callback(err);
        var bucket = {};
        for (var r in records) {
          if (!records.hasOwnProperty(r)) continue;
          var key = records[r].lbModelName;
          if (!key) {
            key = records[r].requestUrl;
          }

          if (!bucket.hasOwnProperty(key)) bucket[key] = 0;
          bucket[key] += 1;
        }
        callback(null, bucket);
      }
    );
  }
  ExpressUsageRecord.dailySummary = dailySummary;

  function hourlySummary(modelOrUri, windowStartTime, callback) {
    var windowStart = new Date(windowStartTime);
    windowStart.setMinutes(0);
    windowStart.setSeconds(0);
    windowStart.setMilliseconds(0);
    windowStart = Number(windowStart);

    var windowEnd = windowStart + 60 * 60 * 1000;
    var q = {
      where: {
        or: [{lbModelName: modelOrUri}, {requestUrl: modelOrUri}],
        timeStamp: {gt: windowStart, lt: windowEnd}
      }
    };
    ExpressUsageRecord.find(q, function(err, records) {
      if (err) return callback(err);
      var bucket = new Array(20);
      for (var i = 0; i < 20; i++) {
        bucket[i] = {
          timeStamp: windowStart + (i * 5) * 60 * 1000,
          GET: 0,
          POST: 0,
          PUT: 0,
          DELETE: 0
        };
      }

      for (var r in records) {
        if (!records.hasOwnProperty(r)) continue;
        var ts = records[r].timeStamp;
        var method = records[r].requestMethod;
        var key = Math.floor(ts.getMinutes() / 5);
        bucket[key][method] += 1;
      }
      callback(null, bucket);
    });
  }
  ExpressUsageRecord.hourlySummary = hourlySummary;

  function endpointDetail(modelOrUri, windowStartTime, callback) {
    var windowStart = new Date(windowStartTime);
    var minutes = windowStart.getMinutes();
    windowStart.setMinutes(minutes - minutes % 5);
    windowStart.setSeconds(0);
    windowStart.setMilliseconds(0);
    windowStart = Number(windowStart);
    var windowEnd = windowStart + 5 * 60 * 1000;

    var q = {
      where: {
        or: [{lbModelName: modelOrUri}, {requestUrl: modelOrUri}],
        timeStamp: {gt: windowStart, lt: windowEnd}
      }
    };
    ExpressUsageRecord.find(q, callback);
  }
  ExpressUsageRecord.endpointDetail = endpointDetail;
};
