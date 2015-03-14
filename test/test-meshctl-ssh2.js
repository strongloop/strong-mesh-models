var assert = require('assert');
var exec = require('./exec-meshctl');
var test = require('tap').test;
var testCmdHelper = require('./meshctl-helper');
var util = require('util');
var ServiceManager = require('../index').ServiceManager;


test('Test SSH tunnel', function(t) {
  function TestServiceManager() {
  }
  util.inherits(TestServiceManager, ServiceManager);

  testCmdHelper(t, TestServiceManager, function(t, service, instance, port) {
    t.test('Setup service manager', function(tt) {
      function ctlRequest(s, i, req, callback) {
        assert.deepEqual(req, {cmd: 'start'}, 'Request should match');
        callback(null, {message: 'starting...'});
      }
      TestServiceManager.prototype.ctlRequest = ctlRequest;
      tt.end();
    });

    t.test('Start CLI', function(tt) {
      exec.resetHome();
      exec.withSSH(port, 'start', function(err, stdout) {
        tt.ifError(err, 'command should not error');
        tt.equal(stdout, 'starting...\n', 'Rendered output should match');
        tt.end();
      });
    });
  });
});
