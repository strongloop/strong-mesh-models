var assert = require('assert');
var debug = require('debug')('strong-mesh-models:service-manager');

var deleteNext = {};

function modelWatcher(msg) {
  assert(msg.table === this.modelName);
  debug('model watcher served: %s, op: %s, when: %s, payload: %j',
      this.modelName, msg.op, msg.when, msg.payload);
  var ctx = {
    'instance': new this.modelInst(msg.payload),
    'isNewInstance': (msg.op === 'INSERT'),
    'where': msg.op === 'DELETE' ? {'id': msg.payload.id} : null,
  };
  debug('================== ctx %j\n%j', ctx, deleteNext);
  // function noop() {}
  if (msg.op === 'DELETE') this.deleteFun(ctx, deleteNext[this.modelName]);
  else this.saveFun(ctx, this.saveNext);
}

/*
  var watcherCtx = {
    'modelName': name,
    'watcher': serviceManager._dbWatcher,
    'saveFun': saveObserver,
    'saveNext': next,
    'deleteFun': deleteObserver,
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

function shouldWatch(serviceManager, name, next) {
  var should = !!serviceManager._dbWatcher;
  if (should && next && !deleteNext[name]) deleteNext[name] = next;
  return should && !serviceManager._dbWatcher.isWatching(name);
}
exports.shouldWatch = shouldWatch;
