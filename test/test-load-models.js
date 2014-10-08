var test = require('tap').test;

test('load models', function(t) {
  var app = require('./helper');

  function end() {
    app.stop(function() {
      t.end();
    });
  }

  app.once('error', function(err) {
    t.assert(!err, 'App should start succesfully');
    end();
  });

  app.once('started', function() {
    t.assert(true, 'Models should be loaded without errors');

    var Service = app.models.ServerService;
    var s = new Service({
      name: 'some service',
      deploymentInfo: {
        foo: 1
      }
    });
    s.save(function(err, savedService) {
      t.assert(!err, 'service save should not error');
      t.assert(!savedService.deploymentInfo,
        'deploymentInfo should not be present');
      end();
    });
  });

  app.start();
});
