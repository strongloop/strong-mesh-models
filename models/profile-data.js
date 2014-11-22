var util = require('util');

module.exports = function(ProfileData) {
  ProfileData.beforeCreate = function(next) {
    // Generate a unique ID for this process
    var profileId = util.format(
      '%d-%d-%d-%s',
      new Date().getTime(),
      this.serviceInstanceId,
      this.targetId,
      this.type);

    this.id = this.id || profileId;
    next();
  };
};
