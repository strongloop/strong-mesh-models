module.exports = function(ServiceContainer) {
  ServiceContainer.disableRemoteMethod('create', true);
  ServiceContainer.disableRemoteMethod('upsert', true);
  ServiceContainer.disableRemoteMethod('updateAttributes');
  ServiceContainer.disableRemoteMethod('deleteById', true);
  ServiceContainer.disableRemoteMethod('updateAll', true);
}
