var debug = require('debug')('strong-mesh-models:server:observer-helper');

function observerHelper(Model, saveObserver, deleteObserver) {
  Model.observe('after save', saveObserver);
  Model.observe('before delete', deleteObserver);

  var modelName = Model.modelName.toLowerCase();

  Model.useDbWatcher = function(dbWatcher, callback) {
    Model.removeObserver('after save', saveObserver);
    Model.removeObserver('before delete', deleteObserver);

    function noOpCallback() {
    }

    dbWatcher.on(modelName, function(msg) {
      debug('%s notification: %j', modelName, msg);
      if (msg.op === 'DELETE')
        return deleteObserver({instance: new Model(msg.payload)}, noOpCallback);
      saveObserver({
        instance: new Model(msg.payload),
        isNewInstance: msg.op === 'INSERT'
      }, noOpCallback);
    });
    dbWatcher.watchTable(modelName, callback);
  };
}
module.exports = observerHelper;
