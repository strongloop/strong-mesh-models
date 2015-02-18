var uuid = require('uuid');

module.exports = function(Group) {
  Group.definition.properties.id.default = function() {
    return uuid.v4();
  };
};
