var exec = require('./exec-meshctl');
var test = require('tap').test;

test('Test help messages', function(t) {
  exec(0, '--help', function(err, usage1) {
    t.ifError(err, 'command should not error');
    exec(0, '-h', function(err, usage2) {
      t.ifError(err, 'command should not error');
      t.equal(usage1, usage2, 'usage messages should match');
      t.end();
    });
  });
});
