module.exports = function Api(Api) {
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
};
