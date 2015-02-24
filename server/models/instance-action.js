var debug = require('debug')('strong-pm:instance-action');
var path = require('path');
var util = require('util');

module.exports = function(InstanceAction) {
  InstanceAction.observe('before save', function(ctx, next) {
      if (!ctx.instance) return next();
      var app = InstanceAction.app;
      var now = Date.now();
      var action = ctx.instance;
      var req = action.request;

      debug('enter before create: %j', action);
      action.timestamp = now;
      action.result = {};

      app.models.ServiceInstance.findById(
        action.serviceInstanceId,
        function(err, instance) {
          if (err) return next(err);
          instance.serverService(function(err, service) {
            if (err) return next(err);

            function doProfile(err, profile, cmd) {
              if (err) return next(err);
              util._extend(action.result, profile);

              var fileName = path.resolve(
                'profile.' + profile.profileId + '.' + cmd
              );
              var req = {
                cmd: 'current',
                sub: action.request.sub,
                target: action.request.target,
                filePath: fileName
              };

              function complete(res) {
                endProfile(app, profile.profileId, fileName, res);
              }

              InstanceAction.app.serviceManager.ctlRequest(
                service,
                instance,
                req,
                complete
              );
              setImmediate(next);
            }

            switch (req.sub) {
              case 'stop-cpu-profiling':
                return beginProfile(
                  app, now, req.target, 'cpuprofile', doProfile
                );
              case 'heap-snapshot':
                return beginProfile(
                  app, now, req.target, 'heapsnapshot', doProfile
                );
              default:
              {
                InstanceAction.app.serviceManager.ctlRequest(
                  service,
                  instance,
                  action.request,
                  function(res) {
                    action.result = res;
                    next();
                  }
                );
                return;
              }
            }
          });
        }
      );
    }
  );
};

function endProfile(app, profileId, fileName, res) {
  var ProfileData = app.models.ProfileData;
  var update = {
    id: profileId
  };

  if (res.error) {
    update.errored = res.error;
  } else {
    update.completed = true;
    update.fileName = fileName;
  }

  ProfileData.upsert(update, function(err, profile) {
    debug('end profile after create: %j', err || profile);
    if (err) {
      console.error('Unrecoverable error upserting %j', update);
      throw err;
    }
  });
}

function beginProfile(app, now, target, type, callback) {
  var ProfileData = app.models.ProfileData;
  var ServerService = app.models.ServerService;

  if (target == null) {
    return callback(Error('Missing required argument: `target`'));
  }

  var profile = new ProfileData({
    executorId: 1,
    serverServiceId: 1,
    instanceId: 1,
    targetId: target,
    type: type,
    startTime: now
  });

  profile.save(function(err, profile) {
    if (err) return callback(err);

    var pathname = [
      app.get('restApiRoot'),
      ServerService.sharedClass.http.path,
      '1',
      ProfileData.sharedClass.http.path,
      String(profile.id),
      'download'
    ].join('/').replace(/\/+/g, '/'); // Compress // to /

    debug('begin profile: %j', profile, pathname);

    callback(null, {
      profileId: profile.id,
      url: pathname,
    }, type);
  });
}
