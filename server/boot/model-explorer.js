// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: strong-mesh-models
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

module.exports = function mountLoopBackExplorer(server) {
  var explorer;
  try {
    explorer = require('loopback-component-explorer');
    var restApiRoot = server.get('restApiRoot');

    server.once('started', function() {
      server.use('/explorer', explorer.routes(server, {basePath: restApiRoot}));
    });
  } catch (err) {
    // Print the message only when the app was started via `server.listen()`.
    // Do not print any message when the project is used as a component.
    server.once('started', function() {
      console.log(
        'Run `npm install loopback-explorer` to enable the LoopBack explorer'
      );
    });
    return;
  }
};
