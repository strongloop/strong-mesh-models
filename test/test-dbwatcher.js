// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: strong-mesh-models
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

var ServiceManager = require('../index').ServiceManager;
var meshServer = require('../index').meshServer;
var test = require('tap').test;

test('Test DB watcher', function(t) {
  var serviceManager = new ServiceManager();
  var app = meshServer(serviceManager);
  var ServerService = app.models.ServerService;
  // var ServiceInstance = app.models.ServiceInstance;
  // var Executor = app.models.Executor;

  var dbWatcher = {
    models: {},

    on: function(model, observer) {
      dbWatcher.models[model] = observer;
    },
    watchTable: function() {},
  };

  app.set('port', 0);

  t.test('Test loopback observers', function(tt) {
    tt.plan(3);

    serviceManager.onServiceUpdate = function(service, isNew, callback) {
      tt.equal(isNew, true, 'New service should be notified');
      tt.equal(service.id, 1, 'Service ID should match');
      if (callback) callback();
    };

    ServerService.create({
      id: 1,
      name: 's1',
      _groups: [{id: 1, name: 'g1', scale: 1}],
    }, function(err) {
      tt.ifError(err);
    });
  });

  t.test('Test disabling loopback observers', function(tt) {
    tt.plan(1);

    serviceManager.onServiceUpdate = function(service, isNew, callback) {
      tt.fail('onServiceUpdate method should not be called');
      if (callback) callback();
    };

    app.useDbWatcher(dbWatcher);
    ServerService.create({
      id: 2,
      name: 's2',
      _groups: [{id: 1, name: 'g1', scale: 1}],
    }, function(err) {
      tt.ifError(err);
    });
  });

  t.test('DBWatcher events are passed through', function(tt) {
    tt.plan(2);

    serviceManager.onServiceUpdate = function(service, isNew, callback) {
      tt.equal(isNew, true, 'New service should be notified');
      tt.equal(service.id, 3, 'Service ID should match');
      if (callback) callback();
    };

    dbWatcher.models.serverservice({
      op: 'INSERT',
      payload: ServerService({
        id: 3,
        name: 's3',
        _groups: [{id: 1, name: 'g1', scale: 1}],
      }),
    });
  });

  t.end();
});
