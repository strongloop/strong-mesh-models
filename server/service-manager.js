var debug = require('debug')('strong-mesh-models:server:service-manager');

function ServiceManager() {
  debug('ServiceManager created');
}

function onServiceUpdate(service, callback) {
  debug('onServiceUpdate(%j)', service);
  setImmediate(callback);
}
ServiceManager.prototype.onServiceUpdate = onServiceUpdate;

function onServiceDestroy(service, callback) {
  debug('onServiceDestroy(%j)', service);
  setImmediate(callback);
}
ServiceManager.prototype.onServiceDestroy = onServiceDestroy;

function onInstanceUpdate(instance, callback) {
  debug('onInstanceUpdate(%j)', instance);
  setImmediate(callback);
}
ServiceManager.prototype.onInstanceUpdate = onInstanceUpdate;

function onInstanceDestroy(instance, callback) {
  debug('onInstanceDestroy(%j)', instance);
  setImmediate(callback);
}
ServiceManager.prototype.onInstanceDestroy = onInstanceDestroy;

function onDeployment(service, req, res) {
  debug('onDeployment(%j)', service);
  res.end('hi');
}
ServiceManager.prototype.onDeployment = onDeployment;

function getDeployment(service, req, res) {
  debug('getDeployment(%j)', service);
  res.end('hi');
}
ServiceManager.prototype.getDeployment = getDeployment;

function ctlRequest(service, instance, req, callback) {
  debug('ctlRequest(%j, %j, %j)', service, instance, req);
  callback(null, {error: 'Not implemented'});
}
ServiceManager.prototype.ctlRequest = ctlRequest;

module.exports = ServiceManager;
