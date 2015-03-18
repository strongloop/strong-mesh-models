var ServiceManager = require('../index').ServiceManager;
var test = require('tap').test;
var testCmdHelper = require('./meshctl-helper');
var util = require('util');

test('Test trace client api (disabled trace)', function(t) {
  function TestServiceManager() {
  }
  util.inherits(TestServiceManager, ServiceManager);

  testCmdHelper(t, TestServiceManager, traceTest, false);

  function traceTest(t, service, instance, port, server) {
    t.test('setup mock minkelite server', function(tt) {
      tt.ok(!server.minkelite, 'Minkelite should not be initialized');
      tt.end();
    });

    t.test('send trace notification', function(tt) {
      /* eslint-disable camelcase */
      var notification = {
        cmd: 'trace:object',
        record: {
          version: '1.2.3',
          packet: {
            metadata: {
              account_key: 'key key key'
            }
          }
        }
      };
      /* eslint-enable camelcase */

      server.handleModelUpdate('1', notification, function(err) {
        tt.ifError(err, 'notification should not error');
        tt.end();
      });
    });

    t.test('setup mock process', function(tt) {
      server.models.ServiceProcess.create({
        id: 1,
        parentPid: 1234,
        pid: 1235,
        workerId: 1,
        serviceInstanceId: 1
      }, function(err, proc) {
        tt.ifError(err, 'mock process creation should succeed');
        tt.ok(proc, 'process object should be returned');
        tt.end();
      });
    });

    t.test('test getMetaTransactions', function(tt) {
      instance.processes.findById('1', function(err, proc) {
        tt.ifError(err, 'instance lookup should succeed');
        proc.getMetaTransactions(function(err) {
          tt.ok(err, 'trace command should error');
          tt.end();
        });
      });
    });

    t.test('test getTransaction', function(tt) {
      instance.processes.findById('1', function(err, proc) {
        tt.ifError(err, 'instance lookup should succeed');
        proc.getTransaction('trans 1', function(err) {
          tt.ok(err, 'trace command should error');
          tt.end();
        });
      });
    });

    t.test('test getTimeline', function(tt) {
      instance.processes.findById('1', function(err, proc) {
        tt.ifError(err, 'instance lookup should succeed');
        proc.getTimeline(function(err) {
          tt.ok(err, 'trace command should error');
          tt.end();
        });
      });
    });

    t.test('test getTrace', function(tt) {
      instance.processes.findById('1', function(err, proc) {
        tt.ifError(err, 'instance lookup should succeed');
        proc.getTrace('trace 1', function(err) {
          tt.ok(err, 'trace command should error');
          tt.end();
        });
      });
    });
  }
});
