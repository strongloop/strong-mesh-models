// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: strong-mesh-models
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

'use strict';

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
  apiVersion = require('../package.json').apiVersion;

  server.start(function onStart(err, port) {
    tt.ifError(err, 'server started successfully');
    var client = new Client('http://127.0.0.1:' + port + '/api');
    client.checkRemoteApiSemver(function(err) {
      tt.ifError(err, 'should not error');
      server.stop(function() {
        tt.end();
      });
    });
  });
});
