var uuid = require('uuid');

module.exports = function(Executor) {
  Executor.definition.properties.id.default = function() {
    return uuid.v4();
  };

  Executor.beforeSave = function(callback) {
    if (this.remainingCapacity === null && this.totalCapacity !== null) {
      this.remainingCapacity = this.totalCapacity;
    }
    process.nextTick(callback);
  };
};
