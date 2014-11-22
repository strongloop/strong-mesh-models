var uuid = require('uuid');

module.exports = function(ServiceProcess) {
  ServiceProcess.beforeCreate = function(next) {
    // Generate a unique ID for this process
    var procId = uuid.v4();

    this.id = this.id || procId;
    next();
  };
};
