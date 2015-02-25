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

  app.start = function(callback) {
    // start the web server
    app._server = app.listen(function() {
      var addr = this.address();
      app.emit('started', addr.port);
      console.log('Web server listening at port: %s', addr.port);
      if (callback) return callback(null, addr.port);
    });
    return;
  };

  app.stop = function(callback) {
    this._server.close(function() {
      app.emit('stopped');
      if (callback) callback();
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
