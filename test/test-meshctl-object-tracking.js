var assert = require('assert');
var exec = require('./exec-meshctl');
var test = require('tap').test;
var testCmdHelper = require('./meshctl-helper');
var util = require('util');
var ServiceManager = require('../index').ServiceManager;

test('Test object-tracking commands', function(t) {
  function TestServiceManager() {
  }
  util.inherits(TestServiceManager, ServiceManager);

  testCmdHelper(t, TestServiceManager, function(t, service, instance, port) {
    t.test('Setup service manager (start tracking)', function(tt) {
      function onCtlRequest(s, i, req, callback) {
        assert.deepEqual(req,
          {cmd: 'current', sub: 'start-tracking-objects', target: 1});
        callback(null, {message: 'object tracking started'});
      }
      TestServiceManager.prototype.onCtlRequest = onCtlRequest;
      tt.end();
    });

    t.test('Start tracking API', function(tt) {
      instance.objectTrackingStart(1, function(err, response) {
        tt.ifError(err, 'call should not error');
        tt.equal(response.message, 'object tracking started',
          'Response should match');
        tt.end();
      });
    });

    t.test('Start tracking CLI', function(tt) {
      exec.resetHome();
      exec(port, 'objects-start 1', function(err, stdout) {
        tt.ifError(err, 'command should not error');
        tt.equal(stdout, '', 'Rendered output should match');
        tt.end();
      });
    });

    t.test('Setup service manager (stop tracking)', function(tt) {
      function onCtlRequest(s, i, req, callback) {
        assert.deepEqual(req,
          {cmd: 'current', sub: 'stop-tracking-objects', target: 2});
        callback(null, {message: 'object tracking started'});
      }
      TestServiceManager.prototype.onCtlRequest = onCtlRequest;
      tt.end();
    });

    t.test('Stop tracking API', function(tt) {
      instance.objectTrackingStop(2, function(err, response) {
        tt.ifError(err, 'call should not error');
        tt.equal(response.message, 'object tracking started',
          'Response should match');
        tt.end();
      });
    });

    t.test('Stop tracking CLI', function(tt) {
      exec.resetHome();
      exec(port, 'objects-stop 2', function(err, stdout) {
        tt.ifError(err, 'command should not error');
        tt.equal(stdout, '', 'Rendered output should match');
        tt.end();
      });
    });

    t.test('Setup service manager (error case)', function(tt) {
      function onCtlRequest(s, i, req, callback) {
        assert.deepEqual(req,
          {cmd: 'current', sub: 'start-tracking-objects', target: 3});
        callback(Error('Unable to start tracking'));
      }
      TestServiceManager.prototype.onCtlRequest = onCtlRequest;
      tt.end();
    });

    t.test('Start tracking API (error case)', function(tt) {
      instance.objectTrackingStart(3, function(err /*, response*/) {
        tt.ok(err, 'call should error');
        tt.end();
      });
    });

    t.test('Start tracking CLI (error case)', function(tt) {
      exec.resetHome();
      exec(port, 'objects-start 3', function(err, stdout, stderr) {
        tt.ok(err, 'command should error');
        tt.equal(stderr, 'Command objects-start failed with Error: ' +
          'Unable to start tracking\n',
          'Rendered error should match');
        tt.end();
      });
    });
  });
});
