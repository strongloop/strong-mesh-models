var assert = require('assert');
var debug = require('debug')('strong-mesh-models:service-manager');

function modelWatcher(msg) {
  assert(msg.table === this.modelName);
  console.log('******** model watcher served: %s, op: %s, when: %s, payload: %j',
      this.modelName, msg.op, msg.when, msg.payload);
  var ctx = {
    'instance': new this.modelInst(msg.payload),
    'isNewInstance': (msg.op === 'INSERT'),
    'where': msg.op === 'DELETE' ? {'id': msg.payload.id} : null,
    'Model': this.Model,
  };

  function noop() {}
  if (msg.op === 'DELETE') this.deleteFn(ctx, noop);
  else this.saveFn(ctx, noop);

}

/*
  var watcherCtx = {
    'modelName': name,
    'watcher': serviceManager._dbWatcher,
    'saveFn': saveObserver,
    'deleteFn': deleteObserver,
    'modelInst': serviceManager._meshApp.models.Executor,
    'Model': serviceManager.models.ServiceInstance,
  };
  instModelWatcher(watcherCtx);
 */

function instModelWatcher(watcherCtx) {
  if (!watcherCtx.watcher.isWatching(watcherCtx.modelName, modelWatcher)) {
    console.log('~~~~~~~~~~~~~ instModelWatcher %s', watcherCtx.modelName);
    watcherCtx.watcher.on(watcherCtx.modelName, modelWatcher.bind(watcherCtx));
    watcherCtx.watcher.watchTable(watcherCtx.modelName, function(err) {
      assert(!err);
    });
  }
}
exports.instModelWatcher = instModelWatcher;

function shouldWatch(serviceManager, name, next, op) {
  var should = !!serviceManager._dbWatcher;
  return should && !serviceManager._dbWatcher.isWatching(name, modelWatcher);
}
exports.shouldWatch = shouldWatch;
