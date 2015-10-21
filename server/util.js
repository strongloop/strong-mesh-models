var crypto = require('crypto');

function genToken() {
  return crypto.randomBytes(24).toString('hex');
}
exports.genToken = genToken;
