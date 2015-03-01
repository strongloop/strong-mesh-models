module.exports = function(Executor) {
  Executor.observe('before save', function(ctx, next) {
    if (ctx.instance) {
      // Only required to run during the initial save when the whole model
      // is available.
      if (ctx.instance.remainingCapacity === -1) {
        ctx.instance.remainingCapacity = ctx.instance.totalCapacity;
      }
      next();
    }
  });
};
