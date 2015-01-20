module.exports = function(ServiceMetric) {
  ServiceMetric.disableRemoteMethod('create', true);
  ServiceMetric.disableRemoteMethod('upsert', true);
  ServiceMetric.disableRemoteMethod('updateAttributes');
  ServiceMetric.disableRemoteMethod('deleteById', true);
  ServiceMetric.disableRemoteMethod('updateAll', true);
};
