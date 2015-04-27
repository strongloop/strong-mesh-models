module.exports = function api(Api) {
  Api.remoteMethod(
    'shutdown',
    {
      http: {path: '/shutdown', verb: 'post'},
      isStatic: true,
      accepts: [],
      returns: {arg: 'response', type: 'object', root: true},
      description: 'Shutdown this server.'
    }
  );
  Api.remoteMethod(
    'apiInfo',
    {
      http: {path: '/', verb: 'get'},
      isStatic: true,
      accepts: [],
      returns: {arg: 'response', type: 'Api', root: true},
      description: 'Get API information'
    }
  );
};
