var uuid = require('uuid');

module.exports = function(ServiceMetric) {
  ServiceMetric.definition.properties.id.default = function() {
    return uuid.v4();
  };
};
