module.exports = function mountLoopBackExplorer(server) {
  var explorer;
  try {
    explorer = require('loopback-explorer');
    var restApiRoot = server.get('restApiRoot');

    server.once('started', function() {
      var explorerApp = explorer(server, {basePath: restApiRoot});
      server.use('/explorer', explorerApp);
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
