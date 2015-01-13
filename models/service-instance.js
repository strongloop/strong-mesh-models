module.exports = function(ServiceInstance) {
  ServiceInstance.remoteMethod('downloadProfile',
    {
      isStatic: false,
      http: {path: '/profileDatas/:profileId/download', verb: 'get'},
      accepts: [
        {arg: 'ctx', http: {source: 'context'}}
      ],
      description: 'Download service profiling information'
    });
}
