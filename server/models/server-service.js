var async = require('async');
var debug = require('debug')('strong-mesh-models:server:server-service');
var fs = require('fs');
var util = require('util');

module.exports = function extendServerService(ServerService) {
  ServerService.disableRemoteMethod('upsert', true);
  ServerService.disableRemoteMethod('updateAll', true);

  ServerService.observe('before save', function(ctx, next) {
    var Group = ServerService.app.models.Group;

    if (ctx.instance) {
      // This is only setting default groups for a new service that is created
      // without groups. The multi service case is only hit when updating
      // multiple models, not creating new ones so is not needed.
      var service = ctx.instance;
      if (service._groups.length === 0) {
        service._groups.push(new Group({id: 1, name: 'default', scale: 1}));
      }
      if (service._groups.length === 1 && service._groups[0].scale <= 0) {
        service._groups[0].scale = 1;
      }
      process.nextTick(next);
    }
  });

  ServerService.observe('after save', function(ctx, next) {
    if (ctx.instance) {
      // Full save of Service
      ServerService.app.serviceManager.onServiceUpdate(ctx.instance, next);
    } else {
      // Save of multiple Services
      ServerService.find({where: ctx.where}, function(err, services) {
        if (err) return next(err);
        return async.each(
          services,
          function(service, callback) {
            ServerService.app.serviceManager.onServiceUpdate(service, callback);
          },
          next
        );
      });
    }
  });

  ServerService.observe('before delete', function(ctx, next) {
    ctx.Model.find({where: ctx.where}, function(err, instances) {
      if (err) next(err);
      return async.each(
        instances,
        function(instance, callback) {
          ServerService.app.serviceManager.onServiceDestroy(instance, callback);
        },
        next
      );
    });
  });

  function setServiceCommit(serviceId, commit, callback) {
    ServerService.findById(serviceId, function(err, service) {
      if (err) return callback(err);
      // With loopback, !err isn't the same as 'success'! :-(
      if (!service) callback(new Error(util.format(
        'setServiceCommit: service %j not found', serviceId
      )));
      service.deploymentInfo = commit;
      service.save(callback);
    });
  }
  ServerService.setServiceCommit = setServiceCommit;

  // XXX(sam) serviceFindOrCreate, serviceCreate, serviceFind were almost
  // verbatim ripped from client/client.js: there should be a way of sharing the
  // implementation, perhaps this code can be attached to ServerService in
  // common/models and be available identically on client and server as a js
  // method?
  function serviceFindOrCreate(name, scale, callback) {
    var self = this;
    self.serviceFind(name, function(err, service) {
      if (err && err.statusCode !== 404) return callback(err);
      if (service) return callback(null, service);
      self.serviceCreate(name, scale, callback);
    });
  }
  ServerService.serviceFindOrCreate = serviceFindOrCreate;

  function serviceCreate(name, scale, callback) {
    var Service = this; /* eslint consistent-this:0 */

    if (scale == null) scale = 1;
    var svc = {name: name, _groups: [{id: 1, name: 'default', scale: scale}]};
    Service.create(svc, callback);

    return this;
  }
  ServerService.serviceCreate = serviceCreate;

  function serviceFind(serviceNameOrId, callback) {
    var Service = this; /* eslint consistent-this:0 */

    var filter = {order: ['id ASC']};
    if (serviceNameOrId) {
      filter.where = {
        or: [
          {name: serviceNameOrId},
          {id: serviceNameOrId}
        ]
      };
    }
    Service.findOne(filter, callback);

    return this;
  }
  ServerService.serviceFind = serviceFind;

  function deploy(req, res) {
    ServerService.app.serviceManager.onDeployment(this, req, res);
  }
  ServerService.prototype.deploy = deploy;

  function downloadProfile(ctx) {
    var ProfileData = ServerService.app.models.ProfileData;
    var profileId = ctx.req.params.profileId;
    var res = ctx.res;
    var fileName;

    debug('Download profile %s, profileId');
    ProfileData.findById(profileId, sendProfile);

    function sendProfile(err, profile) {
      if (err) {
        res.statusCode = 404;
        return res.end(util.format('Profile data not found: %s', err.message));
      }

      if (profile.errored) {
        var reason = util.format('Profiling failed: %s', profile.errored);
        debug('profile %d errored 500/%s', profileId, reason);
        res.statusCode = 500;
        return res.end(reason);
      }

      if (profile.completed) {
        fileName = profile.fileName;
        return fs.stat(fileName, checkandSendFile);
      }

      // Else, not complete
      res.statusCode = 204;
      debug('profile %d not yet complete', profileId);
      return res.end('not yet completed');
    }

    function checkandSendFile(err, stat) {
      if (err) {
        res.statusCode = 404;
        return res.end('Profile data not found.');
      }

      debug('profile %d complete. sending', profileId);
      var readStream = fs.createReadStream(fileName);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Content-Disposition', 'attachment; filename=' + fileName);
      readStream.pipe(res);
    }
  }
  ServerService.prototype.downloadProfile = downloadProfile;

  function getPack(ctx) {
    ServerService.app.serviceManager.getDeployment(this, ctx.req, ctx.res);
  }
  ServerService.prototype.getPack = getPack;

  function setEnv(name, value, callback) {
    this.env = this.env || {};
    debug('setEnv(%j, %j)', name, value);
    this.env[name] = value;
    this.save(function(err, res) {
      callback(err, res && res.env);
    });
  }
  ServerService.prototype.setEnv = setEnv;

  function unsetEnv(name, callback) {
    this.env = this.env || {};
    debug('unsetEnv(%s) [%j]', name, this.env[name]);
    delete this.env[name];
    this.save(function(err, res) {
      callback(err, res && res.env);
    });
  }
  ServerService.prototype.unsetEnv = unsetEnv;

  function setEnvs(envUpd, callback) {
    debug('setEnvs(%j)', envUpd);
    this.env = this.env || {};
    for (var k in envUpd) {
      if (!envUpd.hasOwnProperty(k)) continue;
      if (!envUpd[k])
        delete this.env[k];
      else
        this.env[k] = envUpd[k];
    }
    this.save(function(err, res) {
      callback(err, res && res.env);
    });
  }
  ServerService.prototype.setEnvs = setEnvs;

  function start(callback) {
    this._callOnInstances('start', callback);
  }
  ServerService.prototype.start = start;

  function stop(options, callback) {
    this._callOnInstances('stop', options, callback);
  }
  ServerService.prototype.stop = stop;

  function restart(options, callback) {
    this._callOnInstances('restart', options, callback);
  }
  ServerService.prototype.restart = restart;

  function logDump(callback) {
    this._callOnInstances('logDump', callback);
  }
  ServerService.prototype.logDump = logDump;

  // XXX: Should move this to ServiceGroup.verticalScale or something similar
  function setClusterSize(size, persist, callback) {
    this._callOnInstances('setClusterSize', size, persist, callback);
  }
  ServerService.prototype.setClusterSize = setClusterSize;

  /**
   * Call the requested function on each instance that is part of the service
   * and return an array or instances and corresponding responses.
   *
   * @param {String} fn The function to call
   * @param {*} ... Options or other arguments for the funtion
   * @param {function} callback Callback function.
   * @private
   */
  function _callOnInstances(fn) {
    //Cut out the function name and separate out the callback
    var args = Array.prototype.slice.call(arguments, 1);
    var callback = args.pop();

    this.instances(function(err, instances) {
      if (err) callback(err);
      async.map(instances, function(instance, callback) {
        function cb(err, response) {
          if (err)
            return callback(null, {instance: instance.id, error: err.message});
          callback(null, {instance: instance, response: response});
        }
        var fnArgs = [].concat(args);
        fnArgs.push(cb);
        instance[fn].apply(instance, fnArgs);
      }, callback);
    });
  }
  ServerService.prototype._callOnInstances = _callOnInstances;
};
