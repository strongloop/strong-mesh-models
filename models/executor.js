module.exports = function(Executor) {
  Executor.beforeCreate = function(next) {
    if (this.remainingCapacity === -1) {
      this.remainingCapacity = this.totalCapacity;
    }
    next();
  };
};
