// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: strong-mesh-models
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

var exec = require('./exec-meshctl');
var test = require('tap').test;
var version = require('../package.json').version;

test('Test help messages', function(t) {
  exec(0, '--version', function(err, version1) {
    t.ifError(err, 'command should not error');
    t.equal(version1.trim(), version, 'package version should match');
    exec(0, '-v', function(err, version2) {
      t.ifError(err, 'command should not error');
      t.equal(version1, version2, 'package version should match');
      t.end();
    });
  });
});
