var assert = require('assert');
var exec = require('./exec-meshctl');
var test = require('tap').test;
var testCmdHelper = require('./meshctl-helper');
var util = require('util');
var ServiceManager = require('../index').ServiceManager;

test('Test log-dump command', function(t) {
  function TestServiceManager() {
  }

  util.inherits(TestServiceManager, ServiceManager);

  testCmdHelper(t, TestServiceManager, function(t, service, instance, port) {
    t.test('Setup service manager', function(tt) {
      var logData = [
        'line 1 line 1 line 1 line 1\n',
        'line 2 line 2 line 2 line 2\n',
        'line 3 line 3 line 3 line 3\n',
        'line 4 line 4 line 4 line 4\n',
      ];

      function onCtlRequest(s, i, req, callback) {
        assert.deepEqual(req, {cmd: 'log-dump'});
        if (logData.length > 0)
          return callback(null, {log: logData.shift()});
        return callback(Error('done'));
      }
      TestServiceManager.prototype.onCtlRequest = onCtlRequest;
      tt.end();
    });

    t.test('log-dump API', function(tt) {
      service.logDump(function(err, instanceResponses) {
        tt.ifError(err, 'call should not error');
        tt.equal(instanceResponses[0].response.log,
          'line 1 line 1 line 1 line 1\n',
          'response should match');
        tt.end();
      });
    });

    t.test('log-dump CLI', function(tt) {
      exec.resetHome();
      exec(port, 'log-dump 1', function(err, stdout) {
        tt.ifError(err, 'command should not error');
        tt.equal(stdout, 'line 2 line 2 line 2 line 2\n',
          'log should match');
        tt.end();
      });
    });

    t.test('log-dump CLI', function(tt) {
      exec.resetHome();
      exec(port, 'log-dump 1 --follow', function(err, stdout, stderr) {
        tt.ok(err); // expect error after last line is read
        tt.equal(stdout, 'line 3 line 3 line 3 line 3\n' +
          'line 4 line 4 line 4 line 4\n',
          'log should match');
        var patt = /Command "log-dump" on "\S+" failed with done/;
        tt.assert(patt.test(stderr), 'Rendered error should match');
        tt.end();
      });
    });
  });
});
