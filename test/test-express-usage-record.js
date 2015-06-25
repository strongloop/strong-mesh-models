var ServiceManager = require('../index').ServiceManager;
var async = require('async');
var debug = require('debug')('test-express-usage-record');
var test = require('tap').test;
var testCmdHelper = require('./meshctl-helper');
var util = require('util');

test('express usage record', function(t) {
  function TestServiceManager() {
  }

  util.inherits(TestServiceManager, ServiceManager);

  testCmdHelper(t, TestServiceManager,
    function(t, service, instance, port, server) {

      t.test('setup mock process', function(tt) {
        server.models.ServiceProcess.create({
          parentPid: 1234,
          pid: 1235,
          workerId: 1,
          serviceInstanceId: instance.id,
          stopReason: null
        }, function(err, proc) {
          tt.ifError(err, 'mock process creation should succeed');
          tt.ok(proc, 'process object should be returned');
          tt.end();
        });
      });

      t.test('push notifications', function(tt) {
        var updates = [];

        var oneDay = 24 * 60 * 60 * 1000;
        server.set('ExpressUsageRecord.deleteWindow', String(oneDay));
        var endpoints = [
          {
          url: '/api/ModelA/1',
          model: 'ModelA',
          id: 1,
          remoteMethod: null,
          method: 'GET'
        }, {
          url: '/api/ModelB/2',
          model: 'ModelB',
          id: 1,
          remoteMethod: null,
          method: 'GET'
        }, {
          url: '/api/ModelA/1',
          model: 'ModelA',
          id: 1,
          remoteMethod: null,
          method: 'PUT'
        }, {
          url: '/api/ModelA/1',
          model: 'ModelA',
          id: 1,
          remoteMethod: null,
          method: 'POST'
        }, {
          url: '/api/ModelC/methodF',
          model: 'ModelC',
          id: 1,
          remoteMethod: 'methodF',
          method: 'POST'
        }, {
          url: '/api/ModelD/1',
          model: 'ModelA',
          id: 1,
          remoteMethod: null,
          method: 'POST'
        }, {
          url: '/api/ModelA/1',
          model: 'ModelA',
          id: 1,
          remoteMethod: null,
          method: 'DELETE'
        }, {
          url: '/api/endpoint1/some/url?foo=bar',
          model: null,
          id: null,
          remoteMethod: null,
          method: 'POST'
        }];

        for (var i = 0; i < 500; i++) {
          var status = Math.random() >= 0.5 ? 200 : 404;
          var d = new Date();
          d -= (Math.random() * 23 * 60 * 60 * 1000);
          var m = endpoints[Math.floor(Math.random() * endpoints.length)];

          updates.push({
            'timestamp': Number(d),
            'client': {
              'address': '127.0.0.' + Math.round(Math.random() * 7),
              'id': Math.round((Math.random() * 100)),
              'username': 'a@bcom'
            },
            'request': {
              'method': m.method,
              'url': m.url
            },
            'response': {
              'status': status,
              'duration': Math.round((Math.random() * 100)),
              'bytes': null
            },
            'process': {
              'pid': 1235
            },
            'data': {
              'status': status,
              'url': m.url
            },
            'loopback': {
              modelName: m.model,
              instanceId: m.id,
              remoteMethod: m.remoteMethod
            }
          });
        }

        async.each(updates, function(data, callback) {
          var uInfo = {
            cmd: 'express:usage-record',
            record: data,
          };

          server.handleModelUpdate(1, uInfo, callback);
        }, tt.end.bind(tt));
      });

      t.test('daily summary should return data', function(tt) {
        server.models.ExpressUsageRecord.dailySummary(function(err, data) {
          tt.ifError(err);
          debug(data);
          tt.assert(Object.keys(data).length > 0, 'Data should be returned');
          for (var i in data) {
            if (!data.hasOwnProperty(i)) continue;
            tt.ok(!i.match('foo=bar'), 'query string should not be returned');
          }
          tt.end();
        });
      });

      t.test('hourly summary should return data', function(tt) {
        server.models.ExpressUsageRecord.hourlySummary(
          'ModelA', function(err, data) {
            tt.ifError(err);
            debug(data);
            tt.equal(data.length, 25, 'Data should be returned');
            tt.end();
          }
        );
      });

      t.test('endpoint detail should be available', function(tt) {
        function validateEndpointData(err, data) {
          tt.ifError(err);
          debug(data);
          tt.end();
        }

        function processHourlySummary(err, data) {
          tt.ifError(err);

          console.assert(data);
          console.assert(data.length);

          var dataEntry = null;
          // Search for an entry with some calls
          for (var i = 0; i < data.length; i++) {
            var callCount = data[i].GET + data[i].POST +
              data[i].DELETE + data[i].PUT;
            if (callCount > 0) {
              dataEntry = data[i];
              break;
            }
          }
          console.assert(dataEntry);

          server.models.ExpressUsageRecord.endpointDetail(
            'ModelA', dataEntry.timeStamp, validateEndpointData
          );
        }

        server.models.ExpressUsageRecord.hourlySummary(
          'ModelA', processHourlySummary
        );
      });
    }
  );
});
