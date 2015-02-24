/* eslint no-console:0 */
var loopback = require('loopback');
var boot = require('loopback-boot');
var ServiceManager = require('./service-manager');

function server(serviceManager) {
  var app = module.exports = loopback();
  app.serviceManager = serviceManager;

  // Bootstrap the application, configure models, datasources and middleware.
  // Sub-apps like REST API are mounted via boot scripts.
  boot(app, __dirname);

  app.start = function() {
    // start the web server
    return app.listen(function() {
      app.emit('started');
      console.log('Web server listening at: %s', app.get('url'));
    });
  };
  return app;
}

// start the server if `$ node server.js`
if (require.main === module) {
  var appServer = server(new ServiceManager());
  appServer.start();
}

module.exports = server;
