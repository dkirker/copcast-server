var config = require('./../config');
var db = require('./../db');
var connMap = require('./connectionManager')();

module.exports = function(io,auth, streams) {

  io.use(function(socket, next){
    var handshake = socket.request;
    var token = handshake._query.auth_token || handshake._query.token;
    if (!token) {
      return next(new Error('no token found'));
    }

    auth.validateToken(token, function (err, user, info) {
      if (err) {
        return next(err);
      }

      if (!user) {
        return next(new Error('no user found'));
      }

      if (info.scope && info.scope.indexOf('admin') === -1) {
        return next(null, false);
      }

      next(null, true);
    });


    socket.copcast = {'token': token};

    var clientType = handshake._query.clientType;
    socket.copcast.clientType = clientType;
    // socket.copcast.user = user;
    console.log('-- ' + socket.id + ' joined -- '+handshake._query.userId + ' as ' + clientType);

  });

  io.on('connection', function (socket) {

    auth.validateToken(socket.copcast.token, function (err, user, info) {
      socket.copcast.info = info;
    });


    console.log('new connection with socketId: '+socket.id);
    console.log('new connection with socketId: '+JSON.stringify(socket.copcast));

    return;

    if (socket.copcast.clientType == 'android') {
      handleAndroid(socket, socket.copcast.user);
    } else if (socket.copcast.clientType == 'admin') {
      handleAdmin(socket, socket.copcast.user);
    } else {
      console.error("Invalid clientType: "+socket.copcast.clientType);
      // console.log(socket);
    }

  });

  var handleAndroid = function(socket, user) {
    console.log("connected android: "+user.name + '('+user.id+')');

    connMap.addAndroid(user, socket);
    connMap.emitToAdmins('userEntered', {'userId': user.id});

    socket.on('disconnect', function() {
      console.log('disconnected android: '+user.username + '('+user.id+')');
      connMap.emitToAdmins('userLeft', {'userId': user.id});
      connMap.removeAndroidByUserId(user.id);
    });

    socket.on('missionPaused', function() {
      console.log('mission paused: '+user.username + '('+user.id+')');
      connMap.emitToAdmins('missionPaused', {'userId': user.id});
    });

    socket.on('missionResumed', function() {
      console.log('mission resumed: '+user.username + '('+user.id+')');
      connMap.emitToAdmins('missionResumed', {'userId': user.id});
    });

    socket.on('startStreamingRequest', function() {
      console.log('android request streaming: '+user.username + '('+user.id+')');
      connMap.emitToAdmins('startStreamingRequest', {'userId': user.id});
    });

    socket.on('stopStreamingRequest', function() {
      console.log('android cancelled streaming request: '+user.username + '('+user.id+')');
      connMap.emitToAdmins('stopStreamingRequest', {'userId': user.id});
    });

    socket.on('streamDenied', function() {
      console.log('android denying stream'+user.username + '('+user.id+')');
      socket.copcast.watchersList.forEach(function(watcher_socket){
        watcher_socket.emit('streamDenied', {id: user.id, name: user.name});
      });
    });

    socket.on('streamStopped', function() {
      console.log('notify streaming stopped: '+user.username + '('+user.id+')');
      connMap.emitToAdmins('streamStopped', {'userId': user.id});
    });

    socket.on('streamStarted', function() {
      console.log('notify streaming started: '+user.username + '('+user.id+')');
      connMap.emitToAdmins('streamStarted', {'userId': user.id});
    });

    socket.on('frame', function(data) {
      //broadcasting to watchers
      socket.copcast.watchersList.forEach(function(watching_socket){
        watching_socket.emit('frame', {frame: data});
      });
    });
  };


  var handleAdmin = function(socket, user) {
    console.log("admin entered: "+user.username);
    connMap.addAdmin(user, socket);

    var unwatch = function(watcher_socket, watcher_user) {

      var watched_socket = connMap.removeWatcher(watcher_socket.id);
      var watched_user = connMap.getUserBySocketId(watched_socket.id);
      console.log(watcher_user.name+ "("+watched_user.id+") unwatch "+watched_user.name+" ("+watched_user.id+")");
      var remaining_watchers = watched_socket.copcast.watchersList;

      if (remaining_watchers.size == 0) {
        console.log('no more watchers on '+watched_user.name+" ("+watched_user.id+")");
        watched_socket.emit('stopStreaming');
      }
    }

    // Object.keys(broadcasterList).forEach(function(k){
    //   client.emit('userEntered', {'userId': broadcasterList[k].id});
    // });

    socket.on('watch', function(android_user_id){

      var android_socket = connMap.getSocketByUserId(android_user_id);
      android_socket.copcast.push(user.id);
      console.log(user.name+'('+user.id+')'+' requested to watch: '+android_user_id);
      android_socket.emit('startStreaming');
    });

    socket.on('unwatch', function() {
      unwatch(socket, user);
    });

    socket.on('disconnect', function() {
      console.log('goodbye admin:'+user.username);
      unwatch(socket, user);
      connMap.removeAdminByUserId(user.id);
    });

    socket.on('getBroadcasters', function(fn) {
      var broadcastersIdList = connMap.getAndroidUsers().map(function(u){return u.id});
      console.log('Current broadcasters: '+JSON.stringify(broadcastersIdList));
      fn({'broadcasters': broadcastersIdList} );
    });

    return null;
  }
};
