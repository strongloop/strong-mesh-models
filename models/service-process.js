var uuid = require('uuid');

module.exports = function(ServiceProcess) {
  ServiceProcess.definition.properties.id.default = function() {
    return uuid.v4();
  };
};
