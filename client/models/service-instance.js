var request = require('request');
var util = require('util');

module.exports = function(ServiceInstance) {
  function applyPatch(target, fileData, callback) {
    return this._appCommand({
      cmd: 'patch',
      target: target,
      patch: fileData
    }, callback);
  }
  ServiceInstance.prototype.applyPatch = applyPatch;

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
