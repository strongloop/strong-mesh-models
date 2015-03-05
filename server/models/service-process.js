var async = require('async');
var debug = require('debug')('strong-mesh-models:server:service-process');

module.exports = function extendServiceProcess(ServiceProcess) {
  function recordFork(instanceId, pInfo, callback) {
    debug('Process forked: worker id %d pid %d ppid %d',
      pInfo.id, pInfo.pid, pInfo.ppid);

    var proc = new ServiceProcess({
      pid: pInfo.pid,
      parentPid: pInfo.ppid,
      workerId: pInfo.id,
      serviceInstanceId: instanceId,
      startTime: new Date()
    });

    proc.save(function(err, proc) {
      debug('upsert Process: %j', err || proc);
      if (err) return callback(err);
      callback();
    });
  }
  ServiceProcess.recordFork = recordFork;

  function recordExit(instanceId, pInfo, callback) {
    debug('Process exited: worker id %d pid %d reason %s suicide? %s',
      pInfo.id, pInfo.pid, pInfo.reason, pInfo.suicide);

    function updateProcess(proc, asyncCb) {
      if (!proc) {
        // Ignore process if it is not in the DB. Defensive coding against race
        // conditions, shouldn't happen, never seen, but lets handle it.
        debug('exit event for an unknown process: %j', pInfo);
        return asyncCb();
      }
      if (proc.stopTime === undefined) {
        proc.stopTime = new Date();
        proc.stopReason = pInfo.reason;
        return proc.save(asyncCb);
      }
      // Found proc, but it was stopped, so nothing to do.
      return asyncCb();
    }

    function updateChildren(proc, asyncCb) {
      if (!proc) return asyncCb();

      // Its possible for the supervisor to die by signal or error before its
      // workers. In this case, the workers will exit, but we won't get any exit
      // event for them, or know the reason. The parent's reason will be applied
      // to the children.
      ServiceProcess.find({
        where: {
          serviceInstanceId: instanceId,
          parentPid: proc.pid
        }
      }, function(err, childProcs) {
        if (err) return asyncCb(err);
        return async.each(childProcs, updateProcess, asyncCb);
      });
    }

    return async.waterfall([
      _findProcess(instanceId, +pInfo.id, pInfo.pid),
      updateProcess,
      updateChildren
    ], function ensureSave(err, proc) {
      debug('on exit of %j, save Process: %j', pInfo, err || proc);
      callback(err);
    });
  }
  ServiceProcess.recordExit = recordExit;

  function recordListeningEndpoint(instanceId, pInfo, callback) {
    function updateWorker(proc, asyncCb) {
      if (proc) {
        proc.listeningSockets.push(pInfo.address);
        return proc.save(asyncCb);
      }

      debug('Listening update for an unknown process: %j', pInfo);
      asyncCb();
    }

    return async.waterfall([
      _findProcess(instanceId, +pInfo.id, pInfo.pid),
      updateWorker
    ], function ensureSave(err, proc) {
      debug('Listening of %j, save Process: %j', pInfo, err || proc);
      callback(err);
    });
  }
  ServiceProcess.recordListeningEndpoint = recordListeningEndpoint;

  function recordProfilingState(instanceId, pInfo, callback) {
    function updateProcessStatus(proc, asyncCb) {
      switch (pInfo.cmd) {
        case 'object-tracking':
          proc.isTrackingObjects = pInfo.isRunning;
          break;
        case 'cpu-profiling':
          proc.isProfiling = pInfo.isRunning;
          proc.watchdogTimeout = pInfo.timeout || 0;
          break;
        case 'heap-snapshot':
          proc.isSnapshotting = pInfo.isRunning;
          break;
        default:
          break;
      }
      proc.save(asyncCb);
    }

    return async.waterfall([
      _findProcess(instanceId, +pInfo.id, pInfo.pid),

      updateProcessStatus
    ], function(err, proc) {
      debug('Process entry updated: %j', proc);
      callback(err);
    });
  }
  ServiceProcess.recordProfilingState = recordProfilingState;

  function _findProcess(instanceId, workerId, pid) {
    return ServiceProcess.findOne.bind(ServiceProcess, {
      where: {
        serviceInstanceId: instanceId,
        workerId: +workerId,
        pid: pid,
      }
    });
  }
};
