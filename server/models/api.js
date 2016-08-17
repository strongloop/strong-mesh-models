// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: strong-mesh-models
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

'use strict';

module.exports = function extendApi(Api) {
  /**
   * Shutdown.
   *
   * WARN: This method shuts down the PM service, not just the application.
   * There is no way to remotely start the instance after shutting it down.
   *
   * @param {function} callback Callback function.
   */
  function shutdown(callback) {
    Api.app.serviceManager.onApiRequest(
      {
        cmd: 'shutdown',
      },
      callback
    );
  }
  Api.shutdown = shutdown;

  function apiInfo(callback) {
    Api.app.serviceManager.getApiVersionInfo(callback);
  }
  Api.apiInfo = apiInfo;
};
