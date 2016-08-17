// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: strong-mesh-models
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

'use strict';

module.exports = function api(Api) {
  Api.remoteMethod(
    'shutdown',
    {
      http: {path: '/shutdown', verb: 'post'},
      isStatic: true,
      accepts: [],
      returns: {arg: 'response', type: 'object', root: true},
      description: 'Shutdown this server.',
    }
  );
  Api.remoteMethod(
    'apiInfo',
    {
      http: {path: '/', verb: 'get'},
      isStatic: true,
      accepts: [],
      returns: {arg: 'response', type: 'Api', root: true},
      description: 'Get API information',
    }
  );
};
