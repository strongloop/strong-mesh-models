var async = require('async');
var debug = require('debug')('strong-mesh-models:server:agent-trace');
var deleteOld = require('./delete-old');

module.exports = function extendAgentTrace(AgentTrace) {
  function recordTrace(instanceId, req, callback) {
    debug('trace data: %j', req.trace);
    var ServiceProcess = AgentTrace.app.models.ServiceProcess;

    var q = {where: {
      serviceInstanceId: instanceId,
      pid: +req.processId,
      stopTime: null
    }};

    function saveTrace(proc, traceData, asyncCb) {
      var tData = {
        processId: proc.id,
        workerId: proc.workerId,
        timeStamp: traceData[0],
        trace: traceData
      };
      AgentTrace.upsert(tData, asyncCb);
    }

    return ServiceProcess.findOne(q, function(err, proc) {
      if (err) return callback(err);
      if (!proc) {
        debug('Ignoring trace for unknown process: %d', req.processId);
        return callback();
      }

      return async.each(req.trace.list,
        saveTrace.bind(null, proc),
        function(err) {
          if (err) return callback(err);
          deleteOld(AgentTrace, callback);
        }
      );
    });
  }
  AgentTrace.recordTrace = recordTrace;
};
