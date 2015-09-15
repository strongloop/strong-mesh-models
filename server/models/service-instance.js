var async = require('async');
var debug = require('debug')('strong-mesh-models:server:service-instance');
var fmt = require('util').format;

module.exports = function extendServiceInstance(ServiceInstance) {
  ServiceInstance.beforeRemote(
    'prototype.updateAttributes',
    function(ctx, _, next) {
      debug('updateAttributes with %j', ctx.args.data);
      // When updating the instance via REST, only allow changes to cpus
      // and tracingEnabled
      var reqData = ctx.args.data;
      ctx.args.data = {};
      if (reqData.cpus)
        ctx.args.data.cpus = reqData.cpus;

      if (reqData.tracingEnabled)
        ctx.args.data.tracingEnabled = reqData.tracingEnabled;

      next();
    }
  );

  // For save, the manager is notified after the model has  been persisted in
  // DB so that queries on the DB will return correct information. Similarly
  // for delete, the manager is notified before the model has been deleted from
  // the DB, so that queries will return information.

  // Refer to server-service.js for description of instance vs currentInstance
  // vs data.

  ServiceInstance.observe('after save', function(ctx, next) {
    var serviceManager = ServiceInstance.app.serviceManager;
    var instance = ctx.instance || ctx.currentInstance;

    if (instance) {
      if (serviceManager.onInstanceUpdate.length === 2) {
        serviceManager.onInstanceUpdate(instance, next);
      } else {
        serviceManager.onInstanceUpdate(instance, ctx.isNewInstance, next);
      }
    } else {
      // Save of multiple Services
      ServiceInstance.find({where: ctx.where}, function(err, services) {
        if (err) return next(err);
        return async.each(
          services,
          function(instance, callback) {
            if (serviceManager.onInstanceUpdate.length === 2) {
              serviceManager.onInstanceUpdate(instance, callback);
            } else {
              serviceManager.onInstanceUpdate(instance, false, callback);
            }
          },
          next
        );
      });
    }
  });

  ServiceInstance.observe('before delete', function(ctx, next) {
    var serviceManager = ServiceInstance.app.serviceManager;

    ctx.Model.find({where: ctx.where}, function(err, instances) {
      if (err) next(err);
      return async.each(
        instances,
        function(instance, callback) {
          serviceManager.onInstanceDestroy(instance, callback);
        },
        next
      );
    });
  });

  function recordInstanceInfo(instanceId, instInfo, callback) {
    ServiceInstance.findById(instanceId, function(err, instance) {
      if (err) return callback(err);
      var instUpdateInfo = {
        // Information from supervisor
        startTime: new Date(),
        started: true,
        applicationName: instInfo.appName,
        setSize: instInfo.setSize,
        agentVersion: instInfo.agentVersion,
        debuggerVersion: instInfo.debuggerVersion,

        // Information from strong-pm's mangling of supervisor message
        PMPort: instInfo.PMPort || 0,
        restartCount: instInfo.restartCount || 0,
      };
      if (instInfo.commitHash)
        instUpdateInfo.currentDeploymentId = instInfo.commitHash;
      instance.updateAttributes(
        instUpdateInfo,
        function(err, instance) {
          if (err) return callback(err);

          if (instInfo.containerVersionInfo) {
            // Information from strong-pm's mangling of supervisor message
            return instance.updateAttributes({
              containerVersionInfo: instInfo.containerVersionInfo,
            }, callback);
          }

          // Information from supervisor
          var mdata = instance.containerVersionInfo || {};
          if (instInfo.osVersion) mdata.os = instInfo.osVersion;
          if (instInfo.nodeVersion) mdata.node = instInfo.nodeVersion;
          return instance.updateAttributes({
            containerVersionInfo: mdata,
          }, callback);
        }
      );
    });
  }
  ServiceInstance.recordInstanceInfo = recordInstanceInfo;

  function recordStatusUpdate(instanceId, instInfo, callback) {
    ServiceInstance.findById(instanceId, function(err, instance) {
      if (err) return callback(err);
      if (!instance)
        return callback(Error(
          fmt('Instance with ID %s not found', instanceId)));

      var updates = {};
      if (instInfo.master && instInfo.master.setSize) {
        updates.setSize = instInfo.master.setSize;
        updates.started = true;
      } else {
        updates.setSize = 0;
        updates.started = false;
      }
      instance.updateAttributes(updates, callback);
    });
  }
  ServiceInstance.recordStatusUpdate = recordStatusUpdate;

  function recordStatusWdUpdate(instanceId, instInfo, callback) {
    ServiceInstance.findById(instanceId, function(err, instance) {
      if (err) return callback(err);
      if (!instance)
        return callback(Error(fmt('Instance with ID %s not found', instanceId
          )));
      return instance.updateAttributes(
        {applicationName: instInfo.appName}, callback
      );
    });
  }
  ServiceInstance.recordStatusWdUpdate = recordStatusWdUpdate;

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

  function appCommand(obj, callback) {
    obj.sub = obj.cmd;
    obj.cmd = 'current';
    this.runCommand(obj, callback);
  }
  ServiceInstance.prototype.appCommand = appCommand;

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
  function start(callback) {
    this._simpleCommand('start', callback);
  }
  ServiceInstance.prototype.start = start;

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
  function stop(options, callback) {
    if (options.soft)
      return this._simpleCommand('soft-stop', callback);
    return this._simpleCommand('stop', callback);
  }
  ServiceInstance.prototype.stop = stop;

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
  function restart(options, callback) {
    if (options.rolling)
      return this.appCommand({cmd: 'restart'}, callback);
    if (options.soft)
      return this._simpleCommand('soft-restart', callback);
    return this._simpleCommand('restart', callback);
  }
  ServiceInstance.prototype.restart = restart;

  /**
   * Set cluster size to N workers.
   *
   * @param {int|string} size The number of workers. Set to 'CPU' to start one
   * worker per CPU core available to the instance.
   * @param {boolean} persist Persist the cluster size across restarts.
   * @param {function} callback Callback function.
   */
  function setClusterSize(size, persist, callback) {
    var self = this;
    debug('setClusterSize(%d) size %j persist? %j',
          self.id, size, persist);
    if (persist) {
      return self.updateAttributes({cpus: size}, function(err) {
        return callback(err, {message: 'size was changed'});
      });
    }
    return this.appCommand({cmd: 'set-size', size: size}, callback);
  }
  ServiceInstance.prototype.setClusterSize = setClusterSize;

  /**
   * List dependencies of the current application
   *
   * @param {function} callback Callback function.
   */
  function npmModuleList(callback) {
    return this.appCommand({cmd: 'npm-ls'}, callback);
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

  /**
   * Start tracing on all workers on this instance
   *
   * @param {function} callback Callback function.
   */
  function tracingStart(callback) {
    return this.updateAttributes({tracingEnabled: true}, function(err) {
      if (err) return callback(err);
      return callback(null, {message: 'tracing started'});
    });
  }
  ServiceInstance.prototype.tracingStart = tracingStart;

  /**
   * Stop tracing on all workers on this instance
   *
   * @param {function} callback Callback function.
   */
  function tracingStop(callback) {
    return this.updateAttributes({tracingEnabled: false}, function(err) {
      if (err) return callback(err);
      return callback(null, {message: 'tracing stopped'});
    });
  }
  ServiceInstance.prototype.tracingStop = tracingStop;

  function logDump(callback) {
    this._simpleCommand('log-dump', callback);
  }
  ServiceInstance.prototype.logDump = logDump;

  // Only allow updating ServiceInstance
  ServiceInstance.disableRemoteMethod('create', true);
  ServiceInstance.disableRemoteMethod('upsert', true);
  ServiceInstance.disableRemoteMethod('deleteById', true);
  ServiceInstance.disableRemoteMethod('deleteAll', true);
};
