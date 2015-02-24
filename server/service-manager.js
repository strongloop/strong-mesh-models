var debug = require('debug')('ServiceManager');

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
  callback({error: 'Not implemented'});
}
ServiceManager.prototype.ctlRequest = ctlRequest;

module.exports = ServiceManager;
