// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: strong-mesh-models
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

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

  Executor.remoteMethod(
    'shutdown',
    {
      http: {path: '/shutdown', verb: 'post'},
      isStatic: false,
      accepts: [],
      returns: {arg: 'response', type: 'object', root: true},
      description: 'Shutdown this executor.',
    }
  );
};
