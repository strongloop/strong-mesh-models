// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: strong-mesh-models
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

'use strict';

var assert = require('assert');
var exec = require('./exec-meshctl');
var test = require('tap').test;
var testCmdHelper = require('./meshctl-helper');
var util = require('util');
var ServiceManager = require('../index').ServiceManager;

var skipOnWindows = {
  skip: process.platform === 'win32' && 'assuming no ssh server on Windows',
};

test('Test SSH tunnel', skipOnWindows, function(t) {
  function TestServiceManager() {
  }
  util.inherits(TestServiceManager, ServiceManager);

  testCmdHelper(t, TestServiceManager, function(t, service, instance, port) {
    t.test('Setup service manager', function(tt) {
      function onCtlRequest(s, i, req, callback) {
        assert.deepEqual(req, {cmd: 'start'}, 'Request should match');
        callback(null, {message: 'starting...'});
      }
      TestServiceManager.prototype.onCtlRequest = onCtlRequest;
      tt.end();
    });

    t.test('Start CLI', function(tt) {
      exec.resetHome();
      exec.withSSH(port, 'start 1', function(err, stdout, stderr) {
        tt.ifError(err, 'command should not error');
        tt.comment(stderr);
        tt.equal(stdout, 'Service "service 1" starting...\n',
          'Rendered output should match');
        tt.end();
      });
    });
  });
});
