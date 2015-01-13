module.exports = function(Service) {
  Service.beforeCreate = function(next) {
    this.deploymentInfo = undefined;
    next();
  };

  Service.remoteMethod('deploy', {
    isStatic: false,
    http: [
      {path: '/deploy/*', verb: 'get'},
      {path: '/deploy/*', verb: 'post'},
      {path: '/deploy/*', verb: 'put'}
    ],
    accepts: {arg: 'ctx', http: {source: 'context'}},
    description: 'Deploy service'
  });

  Service.remoteMethod('getPack', {
    isStatic: false,
    http: [
      {path: '/pack', verb: 'get'}
    ],
    accepts: {arg: 'ctx', http: {source: 'context'}}
  });

  //Disable update methods
  Service.disableRemoteMethod('__delete__instances');
  Service.disableRemoteMethod('__create__instances');
  Service.disableRemoteMethod('__destroyById__instances');
  Service.disableRemoteMethod('__updateById__instances');
  Service.disableRemoteMethod('__unlink__instances');
  Service.disableRemoteMethod('__link__instances');
  Service.disableRemoteMethod('__exists__instances');

  Service.disableRemoteMethod('__delete__containers');
  Service.disableRemoteMethod('__create__containers');
  Service.disableRemoteMethod('__destroyById__containers');
  Service.disableRemoteMethod('__updateById__containers');
  Service.disableRemoteMethod('__unlink__containers');
  Service.disableRemoteMethod('__link__containers');
  Service.disableRemoteMethod('__exists__containers');

  Service.disableRemoteMethod('__delete__executors');
  Service.disableRemoteMethod('__create__executors');
  Service.disableRemoteMethod('__destroyById__executors');
  Service.disableRemoteMethod('__updateById__executors');
  Service.disableRemoteMethod('__unlink__executors');
  Service.disableRemoteMethod('__link__executors');
  Service.disableRemoteMethod('__exists__executors');

  Service.disableRemoteMethod('__delete__groups');
  Service.disableRemoteMethod('__create__groups');
  Service.disableRemoteMethod('__destroyById__groups');
  Service.disableRemoteMethod('__updateById__groups');
};
