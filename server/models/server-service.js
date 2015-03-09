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
      ServerService.find(ctx.where, function(err, services) {
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
    ctx.Model.find(ctx.where, function(err, instances) {
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
      service.deploymentInfo = commit;
      service.save(callback);
    });
  }
  ServerService.setServiceCommit = setServiceCommit;

  function deploy(ctx) {
    ServerService.app.serviceManager.onDeployment(this, ctx.req, ctx.res);
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
};
