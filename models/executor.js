module.exports = function(Executor) {
  Executor.beforeCreate = function(next) {
    if (this.remainingCapacity === -1) {
      this.remainingCapacity = this.totalCapacity;
    }
    next();
  };

  Executor.disableRemoteMethod('__delete__instances');
  Executor.disableRemoteMethod('__create__instances');
  Executor.disableRemoteMethod('__destroyById__instances');
  Executor.disableRemoteMethod('__updateById__instances');
  Executor.disableRemoteMethod('__unlink__instances');
  Executor.disableRemoteMethod('__link__instances');
  Executor.disableRemoteMethod('__exists__instances');

  Executor.disableRemoteMethod('__delete__containers');
  Executor.disableRemoteMethod('__create__containers');
  Executor.disableRemoteMethod('__destroyById__containers');
  Executor.disableRemoteMethod('__updateById__containers');
  Executor.disableRemoteMethod('__unlink__containers');
  Executor.disableRemoteMethod('__link__containers');
  Executor.disableRemoteMethod('__exists__containers');

  Executor.disableRemoteMethod('__delete__services');
  Executor.disableRemoteMethod('__create__services');
  Executor.disableRemoteMethod('__destroyById__services');
  Executor.disableRemoteMethod('__updateById__services');
  Executor.disableRemoteMethod('__unlink__services');
  Executor.disableRemoteMethod('__link__services');
  Executor.disableRemoteMethod('__exists__services');
};
