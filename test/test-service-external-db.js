var meshServer = require('../index').meshServer;
var ServiceManager = require('../index').ServiceManager;
var SQLite3 = require('loopback-connector-sqlite3');
var test = require('tap').test;

test('Service environment variable manipulation', function(t) {
  var manager = new ServiceManager();
  var DataSource = require('loopback-datasource-juggler').DataSource;
  var db = new DataSource(SQLite3);

  var server = meshServer(manager, null, {
    db: db
  });
  server.set('port', 0);

  var Service = null;

  t.test('server setup', function(tt) {
    server.start(function onStart(err) {
      tt.ifError(err, 'server started successfully');
      Service = server.models.ServerService;
      tt.equal(Service.dataSource, db);
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
});
