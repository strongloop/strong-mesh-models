var async = require('async');
var debug = require('debug')('strong-mesh-models:server:observer-helper');

function observerHelper(Model) {
  var origModelObserve = Model.observe;
  var origModelRemoveObserver = Model.removeObserver;
  var dbWatcherEnabled = false;
  var modelName = Model.modelName.toLowerCase();

  var saveObservers = [];
  var deleteObservers = [];

  function modelObserveWrapper(event, fn) {
    switch (event) {
      case 'after save':
        saveObservers.push(fn);
        break;
      case 'before delete':
        deleteObservers.push(fn);
        break;
      default:
        return origModelObserve.call(Model, event, fn);
    }

    fn.wrapper = function(ctx, next) {
      if (dbWatcherEnabled) return setImmediate(next);
      fn.apply(this, arguments);
    };
    origModelObserve.call(Model, event, fn.wrapper);
  }
  Model.observe = modelObserveWrapper;

  function modelRemoveObserverWrapper(event, fn) {
    if (!fn.wrapper) return;

    switch (event) {
      case 'after save':
        if (saveObservers.indexOf(fn) !== -1)
          saveObservers.splice(saveObservers.indexOf(fn), 1);
        break;
      case 'before delete':
        if (deleteObservers.indexOf(fn) !== -1)
          deleteObservers.splice(deleteObservers.indexOf(fn), 1);
        break;
      default:
        return origModelRemoveObserver.call(Model, event, fn);
    }
    origModelRemoveObserver.call(Model, event, fn.wrapper);
  }
  Model.removeObserver = modelRemoveObserverWrapper;

  function useDbWatcher(dbWatcher, callback) {
    dbWatcherEnabled = true;

    dbWatcher.on(modelName, function(msg) {
      debug('%s notification: %j', modelName, msg);
      if (msg.op === 'DELETE') {
        async.each(deleteObservers, function(o, callback) {
          o({instance: new Model(msg.payload)}, callback);
        });
        return;
      }

      async.each(saveObservers, function(o, callback) {
        o({
          instance: new Model(msg.payload),
          isNewInstance: msg.op === 'INSERT',
        }, callback);
      });
    });

    dbWatcher.watchTable(modelName, callback);
  }
  Model.useDbWatcher = useDbWatcher;
}
module.exports = observerHelper;
