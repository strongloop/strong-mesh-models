var assert = require('assert');
var debug = require('debug')('strong-mesh-models:service-manager');

var deleteNext = {};
var nexts = {
  'delete': {},
  'save': {},
};

function modelWatcher(msg) {
  assert(msg.table === this.modelName);
  debug('model watcher served: %s, op: %s, when: %s, payload: %j',
      this.modelName, msg.op, msg.when, msg.payload);
  var ctx = {
    'instance': new this.modelInst(msg.payload),
    'isNewInstance': (msg.op === 'INSERT'),
    'where': msg.op === 'DELETE' ? {'id': msg.payload.id} : null,
  };
  // debug('================== ctx %j\n%s',
  //     ctx, (msg.op === 'DELETE') ? nexts['delete'][this.modelName]
  //     : nexts['save'][this.modelName]);
  // function noop() {}
  // if (msg.op === 'DELETE') this.deleteFn(ctx, deleteNext[this.modelName]);
  // else this.saveFn(ctx, this.saveNext);

  // if (msg.op === 'DELETE') this.deleteFn(ctx, nexts.delete[this.modelName]);
  // else this.saveFn(ctx, nexts.save[this.modelName]);

  function noop() {}
  if (msg.op === 'DELETE') this.deleteFn(ctx, noop);
  else this.saveFn(ctx, noop);

}

/*
  var watcherCtx = {
    'modelName': name,
    'watcher': serviceManager._dbWatcher,
    'saveFn': saveObserver,
    'saveNext': next,
    'deleteFn': deleteObserver,
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

function shouldWatch(serviceManager, name, next, op) {
  var should = !!serviceManager._dbWatcher;
  if (should && next && !deleteNext[name]) deleteNext[name] = next;
  assert(op === 'save' || op === 'delete');
  if (should) nexts[op][name] = next;
  return should && !serviceManager._dbWatcher.isWatching(name);
}
exports.shouldWatch = shouldWatch;
