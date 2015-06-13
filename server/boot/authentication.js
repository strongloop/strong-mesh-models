var makeAuthMiddleware = require('../auth');

module.exports = function enableAuthentication(server) {
  server.use(server.get('restApiRoot'), makeAuthMiddleware(server.get('auth')));

  // enable LB authentication
  server.enableAuth();
};
