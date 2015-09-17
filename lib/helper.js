var assert = require('assert');
var debug = require('debug')('strong-mesh-models:service-manager');

function modelWatcher(msg) {
  assert(msg.table === this.modelName);
  var isNew = (msg.op === 'INSERT');
  var instance = new this.modelInst(msg.payload);
  debug('modelWatcher: %s, op: %s, when: %s\n  payload: %j',
      this.modelName, msg.op, msg.when, msg.payload);
  function noop() {}
  if (msg.op === 'DESTROY') this.onDestroy(instance, noop);
  else if (this.onUpdate.length === 2) this.onUpdate(instance, noop);
  else this.onUpdate(instance, isNew, noop);
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
  watcherCtx.watcher.watchTable(watcherCtx.modelName, function(err) {
    assert(!err);
    this.watcher.on(this.modelName, modelWatcher.bind(this));
  }.bind(watcherCtx));
}
exports.instModelWatcher = instModelWatcher;

function shouldWatch(serviceManager, name) {
  return (serviceManager._dbWatcher &&
      !(name in serviceManager._dbWatcher._tableSchema));
}
exports.shouldWatch = shouldWatch;
