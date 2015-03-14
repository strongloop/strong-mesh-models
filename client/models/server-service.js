var request = require('request');
var util = require('util');

module.exports = function extServerService(ServerService) {
  function getDeployEndpoint() {
    var apiUrl = ServerService.app.get('apiUrl');
    return util.format('%s/services/%s/deploy', apiUrl, this.id);
  }
  ServerService.prototype.getDeployEndpoint = getDeployEndpoint;

  // Note:
  //
  // Methods like `ServerService.deploy` and `ServerService.getPack` are remote
  // methods defined using the http ctx object. See
  // `common/models/service.js#L19`. This means that when you boot up the
  // models, LB tried to fill in the implementation but does it incorrectly.
  // The implementation of `deploy` and `getPack` below is the corrected
  // implementation.

  // This file needs to be loaded after models are booted and attached to the
  // remote datasource, otherwise they will be over-ridden by the incorrect
  // implementation.

  function deploy(contentType, callback) {
    var url = this.getDeployEndpoint();
    var req = request.put(url, {headers: {'content-type': contentType}});
    req.on('response', function(rsp) {
      if (callback) callback(null, rsp);
      callback = null;
    });
    req.on('error', function(err) {
      if (callback) callback(err);
      callback = null;
    });
    return req;
  }
  ServerService.prototype.deploy = deploy;

  function getPack(callback) {
    var apiUrl = ServerService.app.get('apiUrl');
    var url = util.format('%s/services/%s/pack', apiUrl, this.id);
    var req = request.get(url);
    req.on('response', function(rsp) {
      if (callback) callback(null, rsp);
      callback = null;
    });
    req.on('error', function(err) {
      if (callback) callback(err);
      callback = null;
    });
  }
  ServerService.prototype.getPack = getPack;

  function refresh(callback) {
    ServerService.findById(this.id, callback);
  }
  ServerService.prototype.refresh = refresh;
};
