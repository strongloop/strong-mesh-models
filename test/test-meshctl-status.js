var assert = require('assert');
var exec = require('./exec-meshctl');
var test = require('tap').test;
var testCmdHelper = require('./meshctl-helper');
var util = require('util');
var ServiceManager = require('../index').ServiceManager;

test('Test status command', function(t) {
  function TestServiceManager() {
  }
  util.inherits(TestServiceManager, ServiceManager);

  var BASE = '/strongloop/strong-pm/.strong-pm';
  var STATUS = {
    pid: 90422,
    port: 8701,
    cwd: BASE,
    base: BASE,
    current: {
      pwd: BASE + '/work/current',
      cwd: BASE + '/work/462df261bc2a8df5455289a801f91ad7a95e8bb0',
      pid: 90423,
      workers: [{
        id: '1',
        pid: 90424,
        uptime: 4915,
      }]
    }
  };

  /*eslint-disable max-len */
  //jscs:disable maximumLineLength
  var RENDERED_STATUS = [
    'Service ID: 1',
    'Service Name: service 1',
    'Environment variables:',
    '  No environment variables defined',
    'Instances:',
    '    Version  Agent version  Cluster size  Driver metadata',
    '     1.2.3       7.8.9            3             N/A',
    'Processes:',
    '       ID      PID  WID          Listening Ports         Tracking objects?  CPU profiling?  Tracing?',
    '    1.1.1230  1230   0',
    '    1.1.1231  1231   1   0.0.0.0:4321, unix:some-socket',
    '    1.1.1232  1232   2            0.0.0.0:4321',
    '    1.1.1233  1233   3            0.0.0.0:4321',
    '',
    ''
  ].join('\n');
  //jscs:enable maximumLineLength
  /*eslint-enable max-len */

  testCmdHelper(t, TestServiceManager, function(t, service, instance, port) {
    t.test('Setup service manager', function(tt) {
      function onCtlRequest(s, i, req, callback) {
        assert.deepEqual(req, {cmd: 'status'}, 'Request should match');
        callback(null, STATUS);
      }
      TestServiceManager.prototype.onCtlRequest = onCtlRequest;
      tt.end();
    });

    t.test('Status summary command API', function(tt) {
      instance.statusSummary(function(err, status) {
        tt.ifError(err, 'status call should not error');
        tt.deepEqual(status, STATUS, 'Status response should match');
        tt.end();
      });
    });

    t.test('Status summary CLI (using REST models)', function(tt) {
      exec.resetHome();
      exec(port, 'status', function(err, stdout) {
        tt.ifError(err, 'command should not error');
        tt.equal(stdout, RENDERED_STATUS, 'Rendered status should match');
        tt.end();
      });
    });

    t.test('Status get-process-count CLI (using REST models)', function(tt) {
      exec.resetHome();
      var EXPECT = 'Service ID 1 processes: 4\n';
      exec(port, 'get-process-count 1', function(err, stdout) {
        tt.ifError(err, 'command should not error');
        tt.equal(EXPECT, stdout, 'Rendered status should match');
        tt.end();
      });
    });
  });
});
