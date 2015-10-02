var assert = require('assert');
var debug = require('debug')('strong-mesh-models:server:instance-action');
var fs = require('fs');
var fmt = require('util').format;
var path = require('path');
var util = require('util');

module.exports = function extendInstanceAction(InstanceAction) {
  InstanceAction.observe('after save', function(ctx, next) {
    // There is no reason to keep these instances around. Until we transition
    // away from them entirely we'll just auto-expire them.
    if (ctx.instance && ctx.isNewInstance) {
      setTimeout(ctx.instance.destroy.bind(ctx.instance), 10 * 1000).unref();
    }
    next();
  });
  InstanceAction.observe('before save', function(ctx, next) {
    if (!ctx.instance) return next();
    var now = Date.now();
    var action = ctx.instance;

    debug('enter before create: %j', action);
    action.timestamp = now;
    action.result = {}; // action.result is the HTTP response to the command

    // The serviceProcessId is in the request because there is no other context
    // to use to pass it from the ServiceProcess that initiated it, but it
    // shouldn't pass down to the supervisor. Move it from request onto action.
    action.serviceProcessId = action.request.serviceProcessId;
    delete action.request.serviceProcessId;

    action.serviceInstance(function(err, instance) {
      if (err) return next(err);
      if (!instance)
        return next(Error('Invalid action, no associated instance found'));

      instance.serverService(function(err, service) {
        if (err) return next(err);
        if (!service)
          return next(Error(fmt(
            'Invalid instance (ID: %s), no associated service found',
            instance.id
          )));

        instance.executor(function(err, executor) {
          if (err) return next(err);
          if (!executor)
            return next(Error(fmt(
              'Invalid instance (ID: %s), no associated executor found',
              instance.id
            )));

          // If we know the target ServiceProcess, or the command has no
          // target, we can process the action.
          if (action.serviceProcessId || action.request.target == null) {
            return processAction(service, executor, instance, action, next);
          }

          // XXX arc is currently directly creating actions, once it starts
          // using the methods on ServiceProcess this branch will never happen.
          // Othewise, we need to find the target ServiceProces
          var target = action.request.target;
          var processFilter = {
            limit: 1,
            where: {or: [{pid: target}, {workerId: target}], stopReason: ''}
          };
          debug('find process: %j', processFilter);
          instance.processes(processFilter, function(err, processes) {
            if (err) return next(err);
            if (processes.length !== 1)
              return next(new Error('Unable to find target ' + target));
            var proc = processes[0];
            action.serviceProcessId = proc.id;
            console.log('ACTION %j', action);
            return processAction(service, executor, instance, action, next);
          });
        });
      });
    });
  });

  function processAction(service, executor, instance, action, next) {
    debug('process action: %j', action);
    switch (action.request.sub) {
      case 'start-cpu-profiling':
        startCpuProfiling(service, executor, instance, action, next);
        return this;
      case 'stop-cpu-profiling':
        finishProfile(
          service, executor, instance, action, 'cpuprofile', next);
        return this;
      case 'heap-snapshot':
        finishProfile(
          service, executor, instance, action, 'heapsnapshot', next);
        return this;
      default:
        request(service, executor, instance, action, next);
        return this;
    }
  }

  function startCpuProfiling(service, executor, instance, action, cb) {
    request(service, executor, instance, action, function(err) {
      if (err) return cb(err);
      findProfile(service, executor, instance, action, 'cpuprofile', _cb);
    });
    function _cb(err) {
      return cb(err); // Pass only the error, not the profile
    }
  }

  function request(service, executor, instance, action, cb) {
    debug('request: svc %j exec %j inst %j process %j: %j',
          service.id, executor.id, instance.id, action.request);
    InstanceAction.app.serviceManager.onCtlRequest(
      service,
      instance,
      action.request,
      function(err, res) {
        if (err) return cb(err);
        action.result = res;
        cb();
      });
  }

  function findProfile(service, executor, instance, action, type, cb) {
    var ProfileData = InstanceAction.app.models.ProfileData;
    var serviceProcessId = action.serviceProcessId;

    assert(serviceProcessId);

    var profile = {
      executorId: executor.id,
      serverServiceId: service.id,
      instanceId: instance.id,
      serviceProcessId: serviceProcessId,
      targetId: action.request.target,
      startTime: action.timestamp,
      type: type,
    };
    var where = {
      where: {
        completed: false,
        serviceProcessId: serviceProcessId,
      }
    };

    debug('findOrCreate profile: %j', profile);

    ProfileData.findOrCreate(where, profile, function(err, profile) {
      debug('returned: %j', err || profile);

      if (err) return cb(err);

      assert(profile);

      var profileData = {
        profileId: profile.id, // Misnamed, its profileDataId
        url: urlDownloadPath(service, executor, instance, profile),
      };
      util._extend(action.result, profileData);

      debug('profile location: %j', profileData);

      return cb(null, profile);
    });
  }

  function urlDownloadPath(service, executor, instance, profile) {
    var ProfileData = InstanceAction.app.models.ProfileData;
    var ServerService = InstanceAction.app.models.ServerService;

    // Don't use path module, because fs seperators depend on OS, and we need to
    // follow URL rules always.
    var pathname = [
      InstanceAction.app.get('restApiRoot'),
      ServerService.sharedClass.http.path,
      service.id,
      ProfileData.sharedClass.http.path,
      String(profile.id),
      'download'
    ].join('/').replace(/\/+/g, '/'); // Compress `//` to `/`

    return pathname;
  }

  function finishProfile(service, executor, instance, action, type, callback) {
    if (action.request.target == null) {
      return callback(Error('Missing required argument: `target`'));
    }

    findProfile(service, executor, instance, action, type, withProfile);

    function withProfile(err, profile) {
      if (err) return callback(err);

      debug('finishing profile: %j', profile);

      var fileName = path.resolve(fmt('profile.%s.%s', profile.id, type));
      var req = {
        cmd: 'current',
        sub: action.request.sub,
        target: action.request.target,
      };

      InstanceAction.app.serviceManager.onCtlRequest(service,
        instance,
        req,
        complete);

      function complete(err, res) {
        if (err) {
          res = res || {};
          res.error = err.message;
        }

        if (res.error) {
          profile.errored = res.error;

          return saveProfile();
        }

        writeProfileData(res.profile);
      }

      function writeProfileData(profileData) {
        assert(profileData);
        fs.writeFile(fileName, profileData, function(err) {
          if (err) {
            console.error('Failed to write profile %d, file %j: %s',
                          profile.id, fileName, err);
            profile.errored = err.message;
          } else {
            profile.completed = true;
            profile.fileName = fileName;
          }
          saveProfile();
        });

      }

      function saveProfile() {
        profile.save(function(err, savedProfile) {
          debug('end profile after stop: %j', err || savedProfile);
          assert.ifError(err);
        });
      }

      // Stop can take a while, respond now, client will poll for the profile
      // state to become completed: true, or just poll until the data becomes
      // available. Though, if the process dies, the polling should stop...
      // caveat emptor.
      setImmediate(callback);
    }
  }
};
