var os = require('os');

module.exports = function(Executor) {
  Executor.observe('before save', function(ctx, next) {
    if (ctx.instance && ctx.isNewInstance) {
      // Only required to run during the initial save when the whole model
      // is available.
      if (ctx.instance.remainingCapacity === -1) {
        ctx.instance.remainingCapacity = ctx.instance.totalCapacity;
      }
    }
    next();
  });

  function getDefaultHostname() {
    return os.hostname();
  }
  Executor.definition.properties.hostname.default = getDefaultHostname;
};
