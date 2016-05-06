// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: strong-mesh-models
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

var makeAuthMiddleware = require('../auth');

module.exports = function enableAuthentication(server) {
  server.use(server.get('restApiRoot'), makeAuthMiddleware(server.get('auth')));

  // enable LB authentication
  server.enableAuth();
};
