var Client = require('../index').Client;
var meshServer = require('../index').meshServer;
var ServiceManager = require('../index').ServiceManager;
var test = require('tap').test;

var manager = new ServiceManager();
var apiVersion;

manager.getApiVersionInfo = function(callback) {
  setImmediate(function() {
    callback(null, {
      apiVersion: apiVersion,
    });
  });
};

var server = meshServer(manager);
server.set('port', 0);

test('check non-matching version', function(tt) {
  apiVersion = '5.1.1-something';

  server.start(function onStart(err, port) {
    tt.ifError(err, 'server started successfully');
    var client = new Client('http://127.0.0.1:' + port + '/api');
    client.checkRemoteApiSemver(function(err) {
      tt.assert(err, 'should mismatch');
      tt.assert(/incompatible.*5.1.1/.test(err.message), err.message);
      server.stop(function() {
        tt.end();
      });
    });
  });
});
