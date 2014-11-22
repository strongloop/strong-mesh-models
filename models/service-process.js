var util = require('util');

module.exports = function(ServiceProcess) {
  ServiceProcess.beforeCreate = function(next) {
    // Generate a unique ID for this process
    var procId = util.format(
      '%d-%d-%d-%d',
      new Date().getTime(),
      this.serviceInstanceId,
      this.workerId,
      this.pid);

    this.id = this.id || procId;
    next();
  };
};
