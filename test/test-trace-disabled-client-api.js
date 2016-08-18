// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: strong-mesh-models
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

'use strict';

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
        record: JSON.stringify({
          version: '1.2.3',
          packet: {
            metadata: {
              account_key: 'key key key',
            },
          },
        }),
      };
      /* eslint-enable camelcase */

      server.handleModelUpdate('1', notification, function(err) {
        tt.ifError(err, 'notification should not error');
        tt.end();
      });
    });

    t.test('test getMetaTransactions', function(tt) {
      instance.processes.findById('1', function(err, proc) {
        tt.ifError(err, 'instance lookup should succeed');
        instance.getMetaTransactions(proc.id, function(err) {
          tt.ok(err, 'trace command should error');
          tt.end();
        });
      });
    });

    t.test('test getTransaction', function(tt) {
      instance.processes.findById('1', function(err, proc) {
        tt.ifError(err, 'instance lookup should succeed');
        instance.getTransaction(proc.id, 'trans 1', function(err) {
          tt.ok(err, 'trace command should error');
          tt.end();
        });
      });
    });

    t.test('test getTimeline', function(tt) {
      instance.processes.findById('1', function(err, proc) {
        tt.ifError(err, 'instance lookup should succeed');
        instance.getTimeline(proc.id, function(err) {
          tt.ok(err, 'trace command should error');
          tt.end();
        });
      });
    });

    t.test('test getTrace', function(tt) {
      instance.processes.findById('1', function(err, proc) {
        tt.ifError(err, 'instance lookup should succeed');
        instance.getTrace(proc.id, 'trace 1', function(err) {
          tt.ok(err, 'trace command should error');
          tt.end();
        });
      });
    });
  }
});
