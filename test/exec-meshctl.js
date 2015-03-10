var Dir = require('temporary').Dir;
var assert = require('assert');
var execFile = require('child_process').execFile;
var debug = require('debug')('strong-scheduler:test');

module.exports = exec;
module.exports.resetHome = resetHome;

function exec(port, cmd, callback) {
  var args = cmd.split(' ');
  args.unshift('-C', 'http://127.0.0.1:' + port);
  args.unshift(require.resolve('../bin/sl-meshctl.js'));

  debug('exec %s %j', process.execPath, args);

  var child = execFile(process.execPath, args, function(err, stdout, stderr) {
    debug('err: %j stdout <%s> stderr <%s>', err, stdout, stderr);
    return callback(err, stdout, stderr);
  });

  child.on('error', function(err) {
    assert.ifError(err, 'exec error');
  });
}

function resetHome() {
  var dir = (new Dir()).path;

  debug('reset home director to: %s', dir);

  process.env.HOME = dir; // Linux
  process.env.USERPROFILE = dir; // Windows
}
