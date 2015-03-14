var request = require('request');
var util = require('util');

module.exports = function(ServiceInstance) {
  function runCommand(req, callback) {
    this.actions.create({
      request: req
    }, function(err, action) {
      if (err) return callback(err);
      if (action.result && action.result.error)
        return callback(Error(action.result.error));

      callback(null, action.result);
    });
  }
  ServiceInstance.prototype.runCommand = runCommand;

  function _appCommand(obj, callback) {
    obj.sub = obj.cmd;
    obj.cmd = 'current';
    this.runCommand(obj, callback);
  }
  ServiceInstance.prototype._appCommand = _appCommand;

  function _simpleCommand(cmd, callback) {
    this.runCommand({cmd: cmd}, callback);
  }
  ServiceInstance.prototype._simpleCommand = _simpleCommand;

  /**
   * Retrieve a summary status of the instance.
   * @param {function} callback Callback function.
   */
  function statusSummary(callback) {
    this.runCommand({cmd: 'status'}, callback);
  }
  ServiceInstance.prototype.statusSummary = statusSummary;

  /**
   * Start the application on the instance.
   *
   * @param {function} callback Callback function.
   */
  function appStart(callback) {
    this._simpleCommand('start', callback);
  }
  ServiceInstance.prototype.appStart = appStart;

  /**
   * Stop the application on the instance.
   *
   * "Soft" stop notify workers they are being disconnected, and give them a
   * grace period for any existing connections to finish. "Hard" stops kill the
   * supervisor and its workers with `SIGTERM`.
   *
   * @param {object} options Options object.
   * @param {boolean} options.soft Soft stop the application.
   * @param {function} callback Callback function.
   */
  function appStop(options, callback) {
    if (options.soft)
      return this._simpleCommand('soft-stop', callback);
    return this._simpleCommand('stop', callback);
  }
  ServiceInstance.prototype.appStop = appStop;

  /**
   * Restart the application on the instance.
   *
   * "Soft" restart notifies all workers they are being disconnected, and give
   * them a grace period for any existing connections to finish. It then stops
   * all workers before starting them. "Hard" restart kill the supervisor and
   * its workers with `SIGTERM` and then starts them.
   *
   * "Rolling" restart is a zero-downtime restart, the workers are soft
   * restarted one-by-one, so that some workers will always be available to
   * service requests.
   *
   * @param {object} options Options object.
   * @param {boolean} options.soft Soft stop the application.
   * @param {boolean} options.rolling Soft stop the application.
   * @param {function} callback Callback function.
   */
  function appRestart(options, callback) {
    if (options.rolling)
      return this._appCommand({cmd: 'restart'}, callback);
    if (options.soft)
      return this._simpleCommand('soft-restart', callback);
    return this._simpleCommand('restart', callback);
  }
  ServiceInstance.prototype.appRestart = appRestart;

  /**
   * Set cluster size to N workers.
   *
   * @param {int|string} size The number of workers. Set to 'CPU' to start one
   * worker per CPU core available to the instance.
   * @param {boolean} persist Persist the cluster size across restarts.
   * @param {function} callback Callback function.
   */
  function clusterSizeSet(size, persist, callback) {
    var self = this;
    return this._appCommand({cmd: 'set-size', size: size},
      function(err, response) {
        if (err && !(persist && err.message === 'application not running')) {
          return callback(err);
        }
        if (persist) {
          return self.updateAttributes({cpus: size}, function(err) {
            callback(err, response);
          });
        }
        callback(null, response);
      }
    );
  }
  ServiceInstance.prototype.clusterSizeSet = clusterSizeSet;

  /**
   * Start tracking objects on a worker.
   *
   * @param {number} target Worker PID or Worker Id.
   * @param {function} callback Callback function.
   */
  function objectTrackingStart(target, callback) {
    return this._appCommand({cmd: 'start-tracking-objects', target: target},
      callback);
  }
  ServiceInstance.prototype.objectTrackingStart = objectTrackingStart;

  /**
   * Stop tracking objects on a worker.
   *
   * @param {number} target Worker PID or Worker Id.
   * @param {function} callback Callback function.
   */
  function objectTrackingStop(target, callback) {
    return this._appCommand({cmd: 'stop-tracking-objects', target: target},
      callback);
  }
  ServiceInstance.prototype.objectTrackingStop = objectTrackingStop;

  /**
   * Start CPU profiling on a worker.
   *
   * @param {number} target Worker PID or Worker Id.
   * @param {object} options Options object.
   * @param {number} options.watchdogTimeout  Watchdog timeout, in milliseconds.
   * In watchdog mode, the profiler is suspended until an event loop stall is
   * detected.
   * @param {function} callback Callback function.
   */
  function cpuProfilingStart(target, options, callback) {
    var timeout = options.watchdogTimeout || 0;
    return this._appCommand({
        cmd: 'start-cpu-profiling',
        target: target,
        timeout: timeout
      },
      callback
    );
  }
  ServiceInstance.prototype.cpuProfilingStart = cpuProfilingStart;

  /**
   * Stop CPU profiling on a worker.
   *
   * @param {number} target Worker PID or Worker Id.
   * @param {function} callback Callback function.
   */
  function cpuProfilingStop(target, callback) {
    return this._appCommand({cmd: 'stop-cpu-profiling', target: target},
      callback);
  }
  ServiceInstance.prototype.cpuProfilingStop = cpuProfilingStop;

  /**
   * Take a snapshot of the HEAP for a worker.
   *
   * @param {number} target Worker PID or Worker Id.
   * @param {function} callback Callback function.
   */
  function heapSnapshot(target, callback) {
    return this._appCommand({cmd: 'heap-snapshot', target: target}, callback);
  }
  ServiceInstance.prototype.heapSnapshot = heapSnapshot;

  /**
   * List dependencies of the current application
   *
   * @param {function} callback Callback function.
   */
  function npmModuleList(callback) {
    return this._appCommand({cmd: 'npm-ls'}, callback);
  }
  ServiceInstance.prototype.npmModuleList = npmModuleList;

  /**
   * Set or unset environment of the current application.
   * This command will cause the application to restart.
   *
   * @param {object} env Object containing key and value of environment to set.
   * Using a value of null will cause the environment to be unset.
   * @param {function} callback Callback function.
   */
  function envSet(env, callback) {
    return this.runCommand({cmd: 'env-set', env: env}, callback);
  }
  ServiceInstance.prototype.envSet = envSet;

  /**
   * Get environment of the current application.
   *
   * @param {function} callback Callback function.
   */
  function envGet(callback) {
    return this._simpleCommand('env-get', callback);
  }
  ServiceInstance.prototype.envGet = envGet;

  function logDump(callback) {
    this._simpleCommand('log-dump', callback);
  }
  ServiceInstance.prototype.logDump = logDump;

  /**
   * Shutdown the instance.
   *
   * WARN: This method shuts down the instance, not just the application. There
   * is no way to remotely start the instance after shutting it down.
   *
   * @param {function} callback Callback function.
   */
  function shutdown(callback) {
    this._simpleCommand('pm-stop', callback);
  }
  ServiceInstance.prototype.shutdown = shutdown;

  function downloadProfile(profileId, callback) {
    var Service = ServiceInstance.app.models.ServerService;

    Service.findById(this.serverServiceId, function(err, service) {
      if (err) return callback(err);

      service.profileDatas.findById(profileId, function(err, profile) {
        if (err) return callback(err);
        if (!profile) return callback(Error('Profile ' +
        profileId +
        ' not found'));

        var url = util.format('%s/services/%s/profileDatas/%s/download',
          ServiceInstance.app.get('apiUrl'),
          service.id,
          profile.id);
        var req = request.get(url);

        // using events instead of callback interface to work around an issue
        // where GETing the file over unix domain sockets would return an empty
        // stream
        req.on('response', function(rsp) {
          if (callback) callback(null, rsp);
          callback = null;
        });
        req.on('error', function(err) {
          if (callback) callback(err);
          callback = null;
        });
      });
    });
  }
  ServiceInstance.prototype.downloadProfile = downloadProfile;
};
