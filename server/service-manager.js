var debug = require('debug')('strong-mesh-models:server:service-manager');

function ServiceManager() {
  debug('ServiceManager created');
}

function onServiceUpdate(service, isNew, callback) {
  debug('onServiceUpdate(%j, %s)', service, isNew);
  setImmediate(callback);
}
ServiceManager.prototype.onServiceUpdate = onServiceUpdate;

function onServiceDestroy(service, callback) {
  debug('onServiceDestroy(%j)', service);
  setImmediate(callback);
}
ServiceManager.prototype.onServiceDestroy = onServiceDestroy;

function onExecutorUpdate(executor, isNew, callback) {
  debug('onExecutorUpdate(%j, %s)', executor, isNew);
  setImmediate(callback);
}
ServiceManager.prototype.onExecutorUpdate = onExecutorUpdate;

function onExecutorDestroy(executor, callback) {
  debug('onExecutorDestroy(%j)', executor);
  setImmediate(callback);
}
ServiceManager.prototype.onExecutorDestroy = onExecutorDestroy;

function onExecutorRequest(id, req, callback) {
  debug('onExecutorRequest(%j)', req);
  callback(Error('Executor request not implemented'));
}
ServiceManager.prototype.onExecutorRequest = onExecutorRequest;

function onInstanceUpdate(instance, isNew, callback) {
  debug('onInstanceUpdate(%j)', instance);
  setImmediate(callback);
}
ServiceManager.prototype.onInstanceUpdate = onInstanceUpdate;

function onInstanceDestroy(instance, callback) {
  debug('onInstanceDestroy(%j)', instance);
  setImmediate(callback);
}
ServiceManager.prototype.onInstanceDestroy = onInstanceDestroy;

function onGatewayUpdate(gateway, isNew, callback) {
  debug('ongatewayUpdate(%j, %s)', gateway, isNew);
  setImmediate(callback);
}
ServiceManager.prototype.onGatewayUpdate = onGatewayUpdate;

function onGatewayDestroy(gateway, callback) {
  debug('onGatewayDestroy(%j)', gateway);
  setImmediate(callback);
}
ServiceManager.prototype.onGatewayDestroy = onGatewayDestroy;

function onProcessListen(proc, callback) {
  debug('onProcessListen(%j)', proc);
  setImmediate(callback);
}
ServiceManager.prototype.onProcessListen = onProcessListen;

function onProcessExit(proc, callback) {
  debug('onProcessExit(%j)', proc);
  setImmediate(callback);
}
ServiceManager.prototype.onProcessExit = onProcessExit;

function onDeployment(service, req, res) {
  debug('onDeployment(%j)', service);
  res.end('hi');
}
ServiceManager.prototype.onDeployment = onDeployment;

function onCtlRequest(service, instance, req, callback) {
  debug('onCtlRequest(%j, %j, %j)', service, instance, req);
  callback(null, {error: 'Control request not implemented'});
}
ServiceManager.prototype.onCtlRequest = onCtlRequest;

function onApiRequest(req, callback) {
  debug('onApiRequest(%j)', req);
  callback(Error('API request not implemented'));
}
ServiceManager.prototype.onApiRequest = onApiRequest;

// Expected to callback with err, or null and a new models.Api
function getApiVersionInfo(callback) {
  callback(Error('API version info request not implemented'));
}
ServiceManager.prototype.getApiVersionInfo = getApiVersionInfo;

module.exports = ServiceManager;
