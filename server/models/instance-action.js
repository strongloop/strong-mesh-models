var debug = require('debug')('strong-mesh-models:server:instance-action');
var path = require('path');
var util = require('util');

module.exports = function extendInstanceAction(InstanceAction) {
  InstanceAction.observe('before save', function(ctx, next) {
    if (!ctx.instance) return next();
    var now = Date.now();
    var action = ctx.instance;

    debug('enter before create: %j', action);
    action.timestamp = now;
    action.result = {};

    action.serviceInstance(function(err, instance) {
      if (err) return next(err);
      instance.serverService(function(err, service) {
        if (err) return next(err);
        instance.executor(function(err, executor) {
          if (err) return next(err);

          processAction(service, executor, instance, action, next);
        });
      });
    });
  });

  function processAction(service, executor, instance, action, next) {
    switch (action.request.sub) {
      case 'stop-cpu-profiling':
        runProfile(service, executor, instance, action, 'cpuprofile', next);
        return this;
      case 'heap-snapshot':
        runProfile(service, executor, instance, action, 'heapsnapshot', next);
        return this;
      default: {
        InstanceAction.app.serviceManager.ctlRequest(
          service,
          instance,
          action.request,
          function(err, res) {
            if (err) return next(err);
            action.result = res;
            next();
          });
        return this;
      }
    }
  }

  function runProfile(service, executor, instance, action, type, callback) {
    if (action.request.target == null) {
      return callback(Error('Missing required argument: `target`'));
    }

    var ProfileData = InstanceAction.app.models.ProfileData;
    var ServerService = InstanceAction.app.models.ServerService;

    var profile = new ProfileData({
      executorId: executor.id,
      serverServiceId: service.id,
      instanceId: instance.id,
      targetId: action.request.target,
      startTime: action.timestamp,
      type: type,
    });

    profile.save(function(err, profile) {
      if (err) return callback(err);

      var pathname = [
        InstanceAction.app.get('restApiRoot'),
        ServerService.sharedClass.http.path,
        service.id,
        ProfileData.sharedClass.http.path,
        String(profile.id),
        'download'
      ].join('/').replace(/\/+/g, '/'); // Compress // to /

      debug('begin profile: %j', profile, pathname);

      var profileData = {
        profileId: profile.id, url: pathname,
      };
      util._extend(action.result, profileData);

      var fileName = util.format('profile.%s.%s', profile.id, type);
      fileName = path.resolve(fileName);

      var req = {
        cmd: 'current',
        sub: action.request.sub,
        target: action.request.target,
        filePath: fileName
      };

      function complete(err, res) {
        if (err) {
          res = res || {};
          res.error = err;
        }

        if (res.error) {
          profile.errored = res.error;
        } else {
          profile.completed = true;
          profile.fileName = fileName;
        }

        profile.save(function(err, savedProfile) {
          debug('end profile after create: %j', err || savedProfile);
          if (err) {
            console.error('Unrecoverable error updating %j', profile);
            throw err;
          }
        });
      }

      InstanceAction.app.serviceManager.ctlRequest(service,
        instance,
        req,
        complete);

      setImmediate(callback);
    });
  }
};
