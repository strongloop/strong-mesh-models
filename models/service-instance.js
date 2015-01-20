module.exports = function(ServiceInstance) {
  ServiceInstance.remoteMethod('downloadProfile',
    {
      isStatic: false,
      http: {path: '/profileDatas/:profileId/download', verb: 'get'},
      accepts: [
        {arg: 'ctx', http: {source: 'context'}}
      ],
      description: 'Download service profiling information'
    }
  );

  ServiceInstance.disableRemoteMethod('create', true);
  ServiceInstance.disableRemoteMethod('upsert', true);
  ServiceInstance.disableRemoteMethod('updateAttributes');
  ServiceInstance.disableRemoteMethod('deleteById', true);
  ServiceInstance.disableRemoteMethod('updateAll', true);

  ServiceInstance.disableRemoteMethod('__delete__profileDatas');
  ServiceInstance.disableRemoteMethod('__create__profileDatas');
  ServiceInstance.disableRemoteMethod('__destroyById__profileDatas');
  ServiceInstance.disableRemoteMethod('__updateById__profileDatas');
  ServiceInstance.disableRemoteMethod('__unlink__profileDatas');
  ServiceInstance.disableRemoteMethod('__link__profileDatas');
  ServiceInstance.disableRemoteMethod('__exists__profileDatas');

  ServiceInstance.disableRemoteMethod('__delete__processes');
  ServiceInstance.disableRemoteMethod('__create__processes');
  ServiceInstance.disableRemoteMethod('__destroyById__processes');
  ServiceInstance.disableRemoteMethod('__updateById__processes');
  ServiceInstance.disableRemoteMethod('__unlink__processes');
  ServiceInstance.disableRemoteMethod('__link__processes');
  ServiceInstance.disableRemoteMethod('__exists__processes');

  ServiceInstance.disableRemoteMethod('__delete__metrics');
  ServiceInstance.disableRemoteMethod('__create__metrics');
  ServiceInstance.disableRemoteMethod('__destroyById__metrics');
  ServiceInstance.disableRemoteMethod('__updateById__metrics');
  ServiceInstance.disableRemoteMethod('__unlink__metrics');
  ServiceInstance.disableRemoteMethod('__link__metrics');
  ServiceInstance.disableRemoteMethod('__exists__metrics');
};
