var assert = require('assert');
var debug = require('debug')('strong-mesh-models:service-manager');

function modelWatcher(msg) {
  assert(msg.table === this.modelName);
  debug('model watcher served: %s, op: %s, when: %s, payload: %j',
      this.modelName, msg.op, msg.when, msg.payload);
  var ctx = {
    'instance': new this.modelInst(msg.payload),
    'isNewInstance': (msg.op === 'INSERT'),
    'id': msg.payload.id,
  };
  debug('================== ctx %j', ctx);
  function noop() {}
  if (msg.op === 'DELETE') this.delete(ctx, noop);
  else this.save(ctx, noop);
}

/*
  var watcherCtx = {
    'modelName': name,
    'watcher': serviceManager._dbWatcher,
    'onUpdate': serviceManager.onExecutorUpdate,
    'onDestroy': serviceManager.onExecutorDestroy,
    'modelInst': serviceManager._meshApp.models.Executor,
  };
  instModelWatcher(watcherCtx);
 */

function instModelWatcher(watcherCtx) {
  watcherCtx.watcher.on(watcherCtx.modelName, modelWatcher.bind(watcherCtx));
  watcherCtx.watcher.watchTable(watcherCtx.modelName, function(err) {
    assert(!err);
  });
}
exports.instModelWatcher = instModelWatcher;

function shouldWatch(serviceManager, name) {
  return (serviceManager._dbWatcher &&
      !(name in serviceManager._dbWatcher._tableSchema));
}
exports.shouldWatch = shouldWatch;
