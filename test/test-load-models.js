// Copyright IBM Corp. 2014,2015. All Rights Reserved.
// Node module: strong-mesh-models
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

var test = require('tap').test;

test('load models', function(t) {
  var app = require('./helper');

  function end() {
    app.stop(function() {
      t.end();
    });
  }

  app.once('error', function(err) {
    t.ifErr(err, 'App should start succesfully');
    end();
  });

  app.once('started', function() {
    t.pass('Models should be loaded without errors');

    var Service = app.models.ServerService;
    var s = new Service({
      name: 'some service',
    });
    s.save(function(err, savedService) {
      console.log(savedService);
      t.ifErr(err, 'service save should not error');
      end();
    });
  });

  app.start();
});
