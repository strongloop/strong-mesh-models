var assert = require('assert');
var exec = require('./exec-meshctl');
var fs = require('fs');
var test = require('tap').test;
var testCmdHelper = require('./meshctl-helper');
var util = require('util');
var ServiceManager = require('../index').ServiceManager;
var path = require('path');

test('Test ls command', function(t) {
  function TestServiceManager() {
  }
  util.inherits(TestServiceManager, ServiceManager);

  var npmDataFile = path.join(__dirname, './test-meshctl-npmls.json');
  var NPM_DATA = JSON.parse(fs.readFileSync(npmDataFile));

  var renderedFile = path.join(__dirname, './test-meshctl-npmls.render-full');
  var FULL_RENDER = fs.readFileSync(renderedFile).toString();

  renderedFile = path.join(__dirname, './test-meshctl-npmls.render-2');
  var DEPTH_2_RENDER = fs.readFileSync(renderedFile).toString();

  testCmdHelper(t, TestServiceManager, function(t, service, instance, port) {
    t.test('Setup service manager', function(tt) {
      function onCtlRequest(s, i, req, callback) {
        assert.deepEqual(req, {cmd: 'current', sub: 'npm-ls'},
          'Request should match');
        callback(null, NPM_DATA);
      }
      TestServiceManager.prototype.onCtlRequest = onCtlRequest;
      tt.end();
    });

    t.test('module list API', function(tt) {
      instance.npmModuleList(function(err, response) {
        tt.ifError(err, 'call should not error');
        tt.deepEqual(response, NPM_DATA, 'response should match');
        tt.end();
      });
    });

    t.test('module list CLI', function(tt) {
      exec.resetHome();
      exec(port, 'npmls 1', function(err, stdout) {
        tt.ifError(err, 'command should not error');
        tt.equal(stdout, FULL_RENDER, 'Rendered output should match');
        tt.end();
      });
    });

    t.test('module list CLI (limit depth)', function(tt) {
      exec.resetHome();
      exec(port, 'npmls 1 2', function(err, stdout) {
        tt.ifError(err, 'command should not error');
        tt.equal(stdout, DEPTH_2_RENDER, 'Rendered output should match');
        tt.end();
      });
    });

    t.test('Setup service manager (error case)', function(tt) {
      function onCtlRequest(s, i, req, callback) {
        assert.deepEqual(req, {cmd: 'current', sub: 'npm-ls'},
          'Request should match');
        callback(Error('no app deployed'));
      }
      TestServiceManager.prototype.onCtlRequest = onCtlRequest;
      tt.end();
    });

    t.test('module list API', function(tt) {
      instance.npmModuleList(function(err) {
        tt.ok(err, 'call should error');
        tt.end();
      });
    });

    t.test('module list CLI', function(tt) {
      exec.resetHome();
      exec(port, 'npmls 1', function(err, stdout, stderr) {
        tt.ok(err, 'command should error');
        var patt = /Command "npmls" on "\S+" failed with Error: no app /;
        tt.assert(patt.test(stderr), 'Rendered error should match');
        tt.end();
      });
    });
  });
});
