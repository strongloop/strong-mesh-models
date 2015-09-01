var meshServer = require('../index').meshServer;
var ServiceManager = require('../index').ServiceManager;
var SQLite3 = require('loopback-connector-sqlite3');
var mktmpdir = require('mktmpdir');
var test = require('tap').test;
var path = require('path');

test('Service environment variable manipulation', function(t) {
  mktmpdir(function(err, dir, done) {
    t.ifError(err);
    if (err) return done();
    t.on('end', done);

    var manager = new ServiceManager();
    var server = meshServer(manager, null, {
      db: {
        connector: SQLite3,
        file: path.join(dir, 'test.db'),
      }
    });
    server.set('port', 0);

    var Service = null;

    t.test('server setup', function(tt) {
      server.start(function onStart(err) {
        tt.ifError(err, 'server started successfully');
        Service = server.models.ServerService;
        tt.equal(Service.dataSource.connector.name, 'sqlite3');
        Service.create({name: 'test', _groups: []}, function(err) {
          tt.ifError(err);
          tt.end();
        });
      });
    });

    t.test('server shutdown', function(tt) {
      server.stop();
      tt.end();
    });

    t.end();
  });
});
