/* eslint no-console:0 */

var boot = require('loopback-boot');
var loopback = require('loopback');
var path = require('path');

var app = module.exports = loopback();

// Set up the /favicon.ico
app.use(loopback.favicon());

// request pre-processing middleware
app.use(loopback.compress());

// boot scripts mount components like REST API
boot(app, path.join(__dirname, 'app'));

// Requests that get this far won't be handled
// by any middleware. Convert them into a 404 error
// that will be handled later down the chain.
app.use(loopback.urlNotFound());

// The ultimate error handler.
app.use(loopback.errorHandler());

app.start = function start() {
  // start the web server
  var server = app.listen(0, function() {
    var listenAddr = this.address();
    app.emit('started', listenAddr);
    console.log('listening at: %s:%d', listenAddr.address, listenAddr.port);
  });
  app.server = server;
  return server;
};

app.stop = function stop(cb) {
  return app.server.close(cb);
};
