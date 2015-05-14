var debug = require('debug')('strong-mesh-models:server:profile-data');
var fmt = require('util').format;
var fs = require('fs');
var path = require('path');

module.exports = function extendProfileData(ProfileData) {
  function recordProfileData(instanceId, req, callback) {
    // req properties are:
    // - stalls
    // - stallout
    // - profile
    // - pst
    // - wid
    // - pid
    var profile = req.profile; // Can be very large
    delete req.profile;

    debug('meta: %j', req);

    var ServiceProcess = ProfileData.app.models.ServiceProcess;

    var qProcess = {
      where: {
        serviceInstanceId: instanceId,
        workerId: +req.wid,
        pid: +req.pid,
        pst: +req.pst,
      }
    };

    ServiceProcess.findOne(qProcess, withProcess);

    var qProfileData;

    function withProcess(err, proc) {
      debug('proc where %j: %j', qProcess.where, err || proc);

      if (err) return callback(err);

      if (!proc) {
        console.error('Profile for %j, but no such process!', qProcess.where);
        return callback();
      }

      qProfileData = {
        where: {
          completed: false,
          serviceProcessId: proc.id,
          type: 'cpuprofile',
        }
      };

      ProfileData.findOne(qProfileData, withProfileData);
    }

    function withProfileData(err, profileData) {
      debug('profile where %j: %j', qProfileData.where, err || profileData);

      if (err) return callback(err);

      if (!profileData) {
        console.error('Process for %j, but no active profile!', qProcess.where);
        return callback();
      }

      var fileName = path.resolve(fmt('profile.%s.cpuprofile', profileData.id));

      fs.writeFile(fileName, profile, function(err) {
        if (err) {
          console.error('Profile %d failed to write %s: %s',
            profileData.id, fileName, err);
          profileData.errored = String(err);
        } else {
          debug('profile %d completed: %s', profileData.id, fileName);
          profileData.completed = true;
          profileData.fileName = fileName;
        }
        profileData.save(callback);
      });
    }
  }

  ProfileData.recordProfileData = recordProfileData;
};
