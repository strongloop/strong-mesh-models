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

  var npmDataFile = path.join(__dirname, './test-meshctl-ls.json');
  var NPM_DATA = JSON.parse(fs.readFileSync(npmDataFile));

  var renderedFile = path.join(__dirname, './test-meshctl-ls.render-full');
  var FULL_RENDER = fs.readFileSync(renderedFile).toString();

  renderedFile = path.join(__dirname, './test-meshctl-ls.render-2');
  var DEPTH_2_RENDER = fs.readFileSync(renderedFile).toString();

  testCmdHelper(t, TestServiceManager, function(t, service, instance, port) {
    t.test('Setup service manager', function(tt) {
      function ctlRequest(s, i, req, callback) {
        assert.deepEqual(req, {cmd: 'current', sub: 'npm-ls'},
          'Request should match');
        callback(null, NPM_DATA);
      }
      TestServiceManager.prototype.ctlRequest = ctlRequest;
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
      exec(port, 'ls', function(err, stdout) {
        tt.ifError(err, 'command should not error');
        tt.equal(stdout, FULL_RENDER, 'Rendered output should match');
        tt.end();
      });
    });

    t.test('module list CLI (limit depth)', function(tt) {
      exec.resetHome();
      exec(port, 'ls 2', function(err, stdout) {
        tt.ifError(err, 'command should not error');
        tt.equal(stdout, DEPTH_2_RENDER, 'Rendered output should match');
        tt.end();
      });
    });

    t.test('Setup service manager (error case)', function(tt) {
      function ctlRequest(s, i, req, callback) {
        assert.deepEqual(req, {cmd: 'current', sub: 'npm-ls'},
          'Request should match');
        callback(Error('no app deployed'));
      }
      TestServiceManager.prototype.ctlRequest = ctlRequest;
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
      exec(port, 'ls', function(err, stdout, stderr) {
        tt.ok(err, 'command should error');
        tt.equal(stderr, 'Command ls failed with Error: no app deployed\n',
          'Rendered error should match');
        tt.end();
      });
    });
  });
});
