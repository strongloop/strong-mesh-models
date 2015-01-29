var uuid = require('uuid');

module.exports = function(ServiceInstance) {
  ServiceInstance.definition.properties.id.default = function() {
    return uuid.v4();
  };

  ServiceInstance.remoteMethod('downloadProfile',
    {
      isStatic: false,
      http: {path: '/profileDatas/:profileId/download', verb: 'get'},
      accepts: [
        {arg: 'ctx', http: {source: 'context'}}
      ],
      description: 'Download service profiling information'
    });
};
