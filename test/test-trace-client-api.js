var ServiceManager = require('../index').ServiceManager;
var assert = require('assert');
var test = require('tap').test;
var testCmdHelper = require('./meshctl-helper');
var util = require('util');

test('Test trace client api', function(t) {
  function TestServiceManager() {
  }
  util.inherits(TestServiceManager, ServiceManager);

  function MockMinkelite() {
  }

  function shutdown() {
  }
  MockMinkelite.prototype.shutdown = shutdown;

  function getMetaTransactions(act, host, pid, callback) {
    assert.equal(act, 'test-app');
    assert.equal(host, 'mockhost');
    assert.equal(pid, 1235);

    // Minkelite does use follow err first callback
    callback({act: 'test-app', hosts: { 'mockhost': { 1235: {data: 1}}}});
  }
  MockMinkelite.prototype.getMetaTransactions = getMetaTransactions;

  function getTransaction(act, trans, host, pid, callback) {
    assert.equal(act, 'test-app');
    assert.equal(host, 'mockhost');
    assert.equal(pid, 1235);
    assert.equal(trans, 'trans 1');

    callback({act: 'test-app', hosts: { 'mockhost': { 1235: {transData: 1}}}});
  }
  MockMinkelite.prototype.getTransaction = getTransaction;

  function getRawMemoryPieces(act, host, pid, callback) {
    assert.equal(act, 'test-app');
    assert.equal(host, 'mockhost');
    assert.equal(pid, 1235);

    callback(
      {act: 'test-app', hosts: { 'mockhost': { 1235: {timelineData: 1}}}}
    );
  }
  MockMinkelite.prototype.getRawMemoryPieces = getRawMemoryPieces;

  function getRawPieces(traceId, decompress, callback) {
    assert.equal(traceId, 'trace 1');
    assert.equal(decompress, true);

    callback({traceData: 1});
  }
  MockMinkelite.prototype.getRawPieces = getRawPieces;

  function postRawPieces(traceVersion, accountName, uInfo, callback) {
    assert.equal(traceVersion, '1.2.3');
    assert.equal(accountName, 'key key key');
    assert.ok(uInfo);
    callback(null, 'ok');
  }
  MockMinkelite.prototype.postRawPieces = postRawPieces;

  testCmdHelper(t, TestServiceManager, traceTest, true);

  function traceTest(t, service, instance, port, server) {
    t.test('setup mock minkelite server', function(tt) {
      server.minkelite.shutdown();
      server.minkelite = new MockMinkelite();
      tt.end();
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

      server.handleModelUpdate('1', notification, function(err, ok) {
        tt.ifError(err, 'notification should not error');
        tt.equal(ok, 'ok', 'result should match');
        tt.end();
      });
    });

    t.test('test getMetaTransactions', function(tt) {
      instance.processes.findById('1', function(err, proc) {
        tt.ifError(err, 'instance lookup should succeed');
        proc.getMetaTransactions(function(err, data) {
          tt.ifError(err, 'getMetaTransactions should not error');
          tt.deepEqual(data, {data: 1}, 'return data should match');
          tt.end();
        });
      });
    });

    t.test('test getTransaction', function(tt) {
      instance.processes.findById('1', function(err, proc) {
        tt.ifError(err, 'instance lookup should succeed');
        proc.getTransaction('trans 1', function(err, data) {
          tt.ifError(err, 'getTransaction should not error');
          tt.deepEqual(data, {transData: 1}, 'return data should match');
          tt.end();
        });
      });
    });

    t.test('test getTimeline', function(tt) {
      instance.processes.findById('1', function(err, proc) {
        tt.ifError(err, 'instance lookup should succeed');
        proc.getTimeline(function(err, data) {
          tt.ifError(err, 'getTimeline should not error');
          tt.deepEqual(data, {timelineData: 1},
            'return data should match');
          tt.end();
        });
      });
    });

    t.test('test getTrace', function(tt) {
      instance.processes.findById('1', function(err, proc) {
        tt.ifError(err, 'instance lookup should succeed');
        proc.getTrace('trace 1', function(err, data) {
          tt.ifError(err, 'getTrace should not error');
          tt.deepEqual(data, {traceData: 1}, 'return data should match');
          tt.end();
        });
      });
    });
  }
});
