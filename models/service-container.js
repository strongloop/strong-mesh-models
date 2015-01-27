var uuid = require('uuid');

module.exports = function(ServiceContainer) {
  ServiceContainer.definition.properties.id.default = function() {
    return uuid.v4();
  };
};
