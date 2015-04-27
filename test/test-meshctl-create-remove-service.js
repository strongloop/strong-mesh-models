var Client = require('../index').Client;
var ServiceManager = require('../index').ServiceManager;
var exec = require('./exec-meshctl');
var meshServer = require('../index').meshServer;
var test = require('tap').test;
var util = require('util');

test('Test service commands', function(t) {
  function TestServiceManager() {
  }
  util.inherits(TestServiceManager, ServiceManager);

  var server = meshServer(new TestServiceManager());
  server.set('port', 0);
  server.start(function(err, port) {
    t.ifError(err);
    var client = new Client('http://127.0.0.1:' + port);
    t.test('create a service', function(tt) {
      exec.resetHome();
      exec(port, 'create aservice 3', function(err, stdout) {
        tt.ifError(err, 'command should not error');
        tt.equal(stdout,
          'Created Service id: 1 name: "aservice" group: "default" scale: 3\n');
        client.serviceFind('aservice', function(err, s) {
          tt.ifError(err, 'command should not error');
          tt.assert(s, 'service should be found');
          tt.end();
        });
      });
    });

    t.test('list services', function(tt) {
      exec.resetHome();
      exec(port, 'ls', function(err, stdout) {
        tt.ifError(err, 'command should not error');
        tt.equal(stdout, 'Id    Name    Scale\n 1  aservice    3\n');
        tt.end();
      });
    });

    t.test('remove service', function(tt) {
      exec.resetHome();
      exec(port, 'remove aservice', function(err, stdout) {
        tt.ifError(err, 'command should not error');
        tt.equal(stdout, 'Destroyed service: aservice\n');
        tt.end();
      });
    });

    t.test('end', function(tt) {
      server.stop(tt.end.bind(tt));
    });

    t.end();
  });
});
