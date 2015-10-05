module.exports = function(DebuggerSession) {
  var store = DebuggerSession._store = Object.create(null);

  DebuggerSession.create = function(svcInstance, svcProcess, callback) {
    if (!(svcProcess.debugger && svcProcess.debugger.running)) {
      var err = new Error('Debugger not running');
      err.statusCode = 400;
      return process.nextTick(function() { callback(err); });
    }

    var session = new DebuggerSession({
      serviceInstance: svcInstance,
      serviceProcess: svcProcess,
      connected: false,
    });
    // NOTE See server/server.js for websocket listener
    session.urlPath = '/debugger/' + session.id;
    console.log('OPEN DEBUGGER SESSION', session.id);
    store[session.id] = session;
    return process.nextTick(function() { callback(null, session); });
  };

  DebuggerSession.findById = function(sid, callback) {
    if (!(sid in store)) {
      var err = new Error('Session ' + sid + ' not found');
      err.statusCode = 404;
      return callback(err);
    }

    var session = store[sid];
    callback(null, session);
  };

  DebuggerSession.prototype.sendCommand = function(cmd, callback) {
    var session = this;
    if (this.connected) return send();

    session._sendAppCommand('dbg-connect', function(err, res) {
      console.log('CONNECT RESPONSE', err, res);
      // TODO handle errors
      send();
    });

    function send() {
      console.log('DEBUGGER %s COMMAND %j', this.id, cmd);
      session._sendAppCommand('dbg-payload', cmd, function(err, res) {
        if (err) console.log('  DEBUGGER CMD FAILED', err);
        else console.log('  DEBUGGER RESPONSE', res);
        callback();
      });
    }
  };

  DebuggerSession.prototype.close = function(callback) {
    // TODO: send "close" command
    console.log('CLOSE DEBUGGER SESSION', this.id);
    callback();
  };

  DebuggerSession.prototype._sendAppCommand = function(cmd, data, callback) {
    if (callback === undefined && typeof data === 'function') {
      callback = data;
      data = undefined;
    }

    var msg = {
      cmd: cmd,
      target: this.serviceProcess.wid,
      data: data,
    };

    this.serviceInstance.appCommand(msg, callback);
  };
};
