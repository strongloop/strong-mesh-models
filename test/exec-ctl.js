// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: strong-mesh-models
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

'use strict';

var Dir = require('temporary').Dir;
var assert = require('assert');
var execFile = require('child_process').execFile;
var debug = require('debug')('strong-mesh-models:test:exec');

module.exports = function(ctl) {
  exec.resetHome = resetHome;
  exec.withSSH = execWithSSH;

  return exec;

  function _exec(apiUrl, cmd, callback) {
    var args = cmd.split(' ');
    args.unshift('-C', apiUrl);
    args.unshift(require.resolve(ctl));

    debug('exec %s %j', process.execPath, args);

    var child = execFile(process.execPath, args, function(err, stdout, stderr) {
      debug('err: %j stdout <%s> stderr <%s>', err, stdout, stderr);
      return callback(err, stdout, stderr);
    });

    child.on('error', function(err) {
      assert.ifError(err, 'exec error');
    });
  }

  function exec(port, cmd, callback) {
    _exec('http://127.0.0.1:' + port, cmd, callback);
  }

  function execWithSSH(port, cmd, callback) {
    _exec('http+ssh://127.0.0.1:' + port, cmd, callback);
  }

  function resetHome() {
    var dir = (new Dir()).path;

    debug('reset home directory to: %s', dir);

    process.env.HOME = dir; // Linux
    process.env.USERPROFILE = dir; // Windows
  }
};
