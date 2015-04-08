var debug = require('debug')('strong-mesh-models:server:datasource');
var url = require('url');

var dbUrl = url.parse(process.env.STRONGLOOP_MESH_DB || 'memory://');
debug('Datasource URI: %j', dbUrl);

var config = {
  'name': 'db',
  'host': dbUrl.hostname,
  'port': dbUrl.port,
  'connector': dbUrl.protocol.slice(0, -1)
};
if (dbUrl.path) config.file = dbUrl.path;

debug('Datasource config: %j', config);

module.exports = {
  'db': config,
  'memory': {
    'name': 'memory',
    'connector': 'memory'
  }
};
