var uuid = require('uuid');

module.exports = function(ProfileData) {
  ProfileData.beforeCreate = function(next) {
    // Generate a unique ID for this process
    var profileId = uuid.v4();

    this.id = this.id || profileId;
    next();
  };

  ProfileData.disableRemoteMethod('create', true);
  ProfileData.disableRemoteMethod('upsert', true);
  ProfileData.disableRemoteMethod('updateAttributes');
  ProfileData.disableRemoteMethod('deleteById', true);
  ProfileData.disableRemoteMethod('updateAll', true);
};
