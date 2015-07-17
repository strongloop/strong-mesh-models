var Client = require('../index').Client;
var ServiceManager = require('../index').ServiceManager;
var assert = require('assert');
var debug = require('debug')('strong-mesh-models:test');
var exec = require('./exec-meshadm');
var fmt = require('util').format;
var meshServer = require('../index').meshServer;
var os = require('os');
var test = require('tap').test;
var util = require('util');

test('Test mesh admin executor commands', function(t) {
  function TestServiceManager() {
  }
  util.inherits(TestServiceManager, ServiceManager);

  var server = meshServer(new TestServiceManager());
  server.set('port', 0);
  server.start(function(err, port) {
    assert.ifError(err);
    var client = new Client('http://127.0.0.1:' + port);

    t.test('empty list', function(tt) {
      exec(port, 'exec-list', function(err, stdout) {
        tt.ifError(err, 'command should not error');
        tt.equal(stdout, 'No executors defined\n');
        tt.end();
      });
    });

    t.test('create', function(tt) {
      exec(port, 'exec-create', function(err, stdout) {
        tt.ifError(err, 'command should not error');
        tt.equal(stdout, 'Created Executor id: 1 token: undefined\n');
        client.models.Executor.findById(1, function(err, e) {
          setImmediate(function() {
            debug('created: %j', err || e);
            tt.ifError(err, 'command should not error');
            tt.equal(e.id, 1);
            tt.deepEqual(e.metadata, {});
            tt.equal(e.remainingCapacity, -1);
            tt.equal(e.hostname, os.hostname());
            tt.end();
          });
        });
      });
    });

    t.test('list', function(tt) {
      exec(port, 'exec-list', function(err, stdout) {
        setImmediate(function() {
          tt.ifError(err, 'command should not error');
          var host = os.hostname();
          // Column spacing is dynamic based on field width, and hostname field
          // width depends on the system hostname, so compress all whitespace.
          var want = 'Id Host Routable Addr Capacity Token Metadata\n' +
            fmt(' 1 %s n/a n/a n/a {}\n', host);
          var have = stdout.replace(/ +/g, ' ');
          tt.equal(have, want);
          tt.end();
        });
      });
    });

    t.test('shutdown', function(tt) {
      TestServiceManager.prototype.onExecutorRequest = function(id, req, cb) {
        debug('onExecutorRequest(%j, %s)', id, req);
        cb(null, {message: 'OK'});
      };
      exec(port, 'exec-shutdown 1', function(err, stdout) {
        setImmediate(function() {
          tt.ifError(err, 'command should not error');
          tt.equal(stdout, 'Shutting down executor: 1\n');
          tt.end();
        });
      });
    });

    t.test('destroy', function(tt) {
      exec(port, 'exec-remove 1', function(err, stdout) {
        setImmediate(function() {
          tt.ifError(err, 'command should not error');
          tt.equal(stdout, 'Removed executor: 1\n');
          tt.end();
        });
      });
    });

    t.test('end', function(tt) {
      server.stop(tt.end.bind(tt));
    });

    t.end();
  });
});
