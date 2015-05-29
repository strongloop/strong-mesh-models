var async = require('async');
var debug = require('debug')('strong-mesh-models:server:service-process');

module.exports = function extendServiceProcess(ServiceProcess) {
  function recordFork(instanceId, pInfo, callback) {
    debug('Process forked: worker id %d pid %d ppid %d pst %d',
      pInfo.id, pInfo.pid, pInfo.ppid, pInfo.pst || pInfo.startTime);
    // XXX(sam) why .pst || .startTime?

    var forkedProcess = {
      pid: pInfo.pid,
      parentPid: pInfo.ppid,
      workerId: pInfo.id,
      serviceInstanceId: instanceId,
      startTime: new Date(pInfo.pst || pInfo.startTime),
    };
    var filter = {where: forkedProcess};

    ServiceProcess.findOrCreate(filter, forkedProcess, function(err, proc) {
      debug('upsert Process: %j', err || proc, pInfo);
      if (err) return callback(err);
      proc.updateAttributes({
        stopReason: '',
        stopTime: null,
      }, callback);
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
      if (proc.stopTime == null) {
        return proc.updateAttributes({
          stopTime: new Date(),
          stopReason: pInfo.reason,
        }, asyncCb);
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
      _findProcess(instanceId, +pInfo.id, +pInfo.pid, +pInfo.pst),
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
        return proc.updateAttributes({
          listeningSockets: proc.listeningSockets.concat(pInfo.address),
        }, asyncCb);
      }

      debug('Listening update for an unknown process: %j', pInfo);
      asyncCb();
    }

    return async.waterfall([
      _findProcess(instanceId, +pInfo.id, +pInfo.pid, +pInfo.pst),
      updateWorker
    ], function ensureSave(err, proc) {
      debug('Listening of %j, save Process: %j', pInfo, err || proc);
      callback(err);
    });
  }
  ServiceProcess.recordListeningEndpoint = recordListeningEndpoint;

  function recordProfilingState(instanceId, pInfo, callback) {
    function updateProcessStatus(proc, asyncCb) {
      var changes = {};
      switch (pInfo.cmd) {
        case 'object-tracking':
          changes.isTrackingObjects = pInfo.isRunning;
          break;
        case 'cpu-profiling':
          changes.isProfiling = pInfo.isRunning;
          changes.watchdogTimeout = pInfo.timeout || 0;
          changes.watchdogStallout = pInfo.stallout || 0;
          break;
        case 'heap-snapshot':
          changes.isSnapshotting = pInfo.isRunning;
          break;
        default:
          break;
      }
      proc.updateAttributes(changes, asyncCb);
    }

    return async.waterfall([
      _findProcess(instanceId, +pInfo.id, pInfo.pid, +pInfo.pst),

      updateProcessStatus
    ], function(err, proc) {
      debug('Process entry updated: %j', proc);
      callback(err);
    });
  }
  ServiceProcess.recordProfilingState = recordProfilingState;

  function recordStatusWdUpdate(instanceId, pInfo, callback) {
    return async.waterfall([
      _findProcess(instanceId, +pInfo.id, pInfo.pid, +pInfo.pst),

      updateProcessStatus
    ], function(err, proc) {
      debug('Process entry updated: %j', err || proc);
      callback(err);
    });

    function updateProcessStatus(proc, asyncCb) {
      proc.isTracing = !!pInfo.isTracing;
      proc.updateAttributes({isTracing: !!pInfo.isTracing}, asyncCb);
    }
  }
  ServiceProcess.recordStatusWdUpdate = recordStatusWdUpdate;

  function _findProcess(instanceId, workerId, pid, pst) {
    var filter = {
      where: {
        serviceInstanceId: instanceId,
        workerId: +workerId,
        pid: pid,
      }
    };
    if (pst) {
      filter.where.startTime = new Date(pst);
    }
    return ServiceProcess.findOne.bind(ServiceProcess, filter);
  }

  function getMetaTransactions(callback) {
    var minkelite = ServiceProcess.app.minkelite;
    var pid = this.pid;

    if (!minkelite) return callback(Error('Tracing is disabled'));

    this._getActAndHost(function(err, act, host) {
      if (err) return callback(err);
      if (!host || !act) return callback(null, []);

      minkelite.getMetaTransactions(act, host, pid, function(data) {
        if (data && data.hosts && data.hosts[host] && data.hosts[host][pid])
          return callback(null, data.hosts[host][pid]);
        callback(null, []);
      });
    });
  }
  ServiceProcess.prototype.getMetaTransactions = getMetaTransactions;

  function getTransaction(trans, callback) {
    var minkelite = ServiceProcess.app.minkelite;
    var pid = this.pid;

    if (!minkelite) return callback(Error('Tracing is disabled'));

    this._getActAndHost(function(err, act, host) {
      if (err) return callback(err);
      if (!host || !act) return callback(null, []);

      minkelite.getTransaction(act, trans, host, pid, function(data) {
        if (data && data.hosts && data.hosts[host] && data.hosts[host][pid])
          return callback(null, data.hosts[host][pid]);
        callback(null, []);
      });
    });
  }
  ServiceProcess.prototype.getTransaction = getTransaction;

  function getTimeline(callback) {
    var minkelite = ServiceProcess.app.minkelite;
    var pid = this.pid;

    if (!minkelite) return callback(Error('Tracing is disabled'));

    this._getActAndHost(function(err, act, host) {
      if (err) return callback(err);
      if (!host || !act) return callback(null, []);

      minkelite.getRawMemoryPieces(act, host, pid, function(data) {
        if (data && data.hosts && data.hosts[host] && data.hosts[host][pid])
          return callback(null, data.hosts[host][pid]);
        callback(null, []);
      });
    });
  }
  ServiceProcess.prototype.getTimeline = getTimeline;

  function getTrace(pfKey, callback) {
    var minkelite = ServiceProcess.app.minkelite;

    if (!minkelite) return callback(Error('Tracing is disabled'));

    minkelite.getRawPieces(pfKey, true, function(data) {
      callback(null, data);
    });
  }
  ServiceProcess.prototype.getTrace = getTrace;

  function _getActAndHost(callback) {
    this.serviceInstance(function(err, instance) {
      if (err) return callback(err);
      var act = instance.applicationName;

      instance.executor(function(err, executor) {
        if (err) return callback(err);
        var host = executor.hostname.split('.')[0];

        callback(null, act, host);
      });
    });
  }
  ServiceProcess.prototype._getActAndHost = _getActAndHost;

  function _appCommand(cmd, callback) {
    var self = this;
    cmd.serviceProcessId = self.id;
    self.serviceInstance(function(err, instance) {
      if (err) return callback(err);
      return instance.appCommand(cmd, callback);
    });
  }
  ServiceProcess.prototype._appCommand = _appCommand;

  /**
   * Start tracking objects on a worker.
   *
   * @param {function} callback Callback function.
   */
  function startObjectTracking(callback) {
    this._appCommand({
        cmd: 'start-tracking-objects',
        target: this.pid,
      }, callback
    );
  }
  ServiceProcess.prototype.startObjectTracking = startObjectTracking;

  /**
   * Stop tracking objects on a worker.
   *
   * @param {function} callback Callback function.
   */
  function stopObjectTracking(callback) {
    this._appCommand({
        cmd: 'stop-tracking-objects',
        target: this.pid,
      }, callback
    );
  }
  ServiceProcess.prototype.stopObjectTracking = stopObjectTracking;

  /**
   * Start CPU profiling on a worker.
   *
   * @param {object} options Options object.
   * @param {number} options.watchdogTimeout  Watchdog timeout, in milliseconds.
   * @param {number} options.watchdogStallout  Watchdog stallout, in counts.
   * @param {function} callback Callback function.
   */
  function startCpuProfiling(options, callback) {
    var timeout = options.watchdogTimeout || 0;
    var stallout = options.watchdogStallout || 0;
    this._appCommand({
        cmd: 'start-cpu-profiling',
        target: this.pid,
        timeout: timeout,
        stallout: stallout,
      }, callback
    );
  }
  ServiceProcess.prototype.startCpuProfiling = startCpuProfiling;

  /**
   * Stop CPU profiling on a worker.
   *
   * @param {function} callback Callback function.
   */
  function stopCpuProfiling(callback) {
    this._appCommand({
        cmd: 'stop-cpu-profiling',
        target: this.pid,
      }, callback
    );
  }
  ServiceProcess.prototype.stopCpuProfiling = stopCpuProfiling;

  /**
   * Take a snapshot of the HEAP for a worker.
   *
   * @param {function} callback Callback function.
   */
  function heapSnapshot(callback) {
    this._appCommand({
        cmd: 'heap-snapshot',
        target: this.pid
      }, callback
    );
  }
  ServiceProcess.prototype.heapSnapshot = heapSnapshot;

  /**
   * Apply patch to worker
   *
   * @param {object} patchData Patch data
   * @param {function} callback Callback function.
   */
  function applyPatch(patchData, callback) {
    this._appCommand({
        cmd: 'patch',
        target: this.pid,
        patch: patchData,
      }, callback
    );
  }
  ServiceProcess.prototype.applyPatch = applyPatch;
};
