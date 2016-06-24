var config = require('./../config');
var StreamBroker = require('./streamBroker');
var db = require('./../db');


module.exports = function(io,auth, streams) {

  var broker = new StreamBroker();
  var adminList = {};

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
  });

  io.on('connection', function (client) {
    var handshake = client.handshake;
    var token = handshake.query.token || handshake.query.auth_token;
    if (!token) {
      return;
    }
    var clientType = handshake.query.clientType;


    auth.validateToken(token, function (err, user, info) {
      if (err) {
        return;
      }
      if (!user) {
        return;
      }
      client.copcast = {};
      user.getGroup().then(function (group) {

        client.copcast.group = group;

        console.log('-- ' + client.id + ' joined -- '+handshake.query.userId + ' as ' + clientType);

        client.copcast.clientType = clientType;
        if (clientType == 'android') {
          handleAndroid(client, user);
        } else if (clientType == 'admin') {
          handleAdmin(client, user);
        } else {
          console.error("Invalid clientType: "+clientType);
          console.log(client);
        }
      });
    });
  });

  var handleAndroid = function(client, user) {

    broker.addBroadcaster(client, user);

    console.log("welcome android: "+user.username);

    Object.keys(adminList).forEach(function(uid) {
      console.log('emitting to: '+uid);
      adminList[uid].emit('userEntered', {'userId': user.id});
    });

    client.on('disconnect', function() {
      console.log('goodbye android: '+user.username);
      broker.removeBroadcaster(user.id);
      Object.keys(adminList).forEach(function(uid) {
        console.log('emitting to disconnect: '+client.id);
        adminList[uid].emit('userLeft', {'userId': user.id});
      });
    });

    client.on('missionPaused', function() {
      console.log('android paused: '+user.username);
      Object.keys(adminList).forEach(function(uid) {
        console.log('emitting to mission paused: '+client.id);
        adminList[uid].emit('missionPaused', {'userId': user.id});
      });
    });

    client.on('missionResumed', function() {
      console.log('android resumed: '+user.username);
      Object.keys(adminList).forEach(function(uid) {
        console.log('emitting to mission resume: '+client.id);
        adminList[uid].emit('missionResumed', {'userId': user.id});
      });
    });

    client.on('startStreamingRequest', function() {
      console.log('android request streaming: '+user.username);
      Object.keys(adminList).forEach(function(uid) {
        console.log('emitting request to start stream: '+client.id);
        adminList[uid].emit('startStreamingRequest', {'userId': user.id});
      });
    });

    client.on('streamDenied', function() {
      broker.getWatchers(user.id).forEach(function(socket) {
        socket.emit('streamDenied', {id: user.id, name: user.name});
      });

    });

    client.on('streamStopped', function() {
      Object.keys(adminList).forEach(function(uid) {
        console.log('emitting to mission stopped: '+client.id);
        adminList[uid].emit('streamStopped');
      });
    });

    client.on('streamStarted', function() {
      Object.keys(adminList).forEach(function(uid) {
        console.log('emitting to mission started: '+client.id);
        adminList[uid].emit('streamStarted');
      });
    });

    client.on('frame', function(data) {
      //broadcasting to watchers
      broker.getWatchers(user.id).forEach(function(socket) {
        //console.log(data.length+" bytes to: "+socket.id);
        socket.emit('frame', {frame: data});
      });

    });

  }

  var handleAdmin = function(client, user) {

    console.log("welcome admin: "+user.username);
    adminList[user.id] = client;

    // Object.keys(broadcasterList).forEach(function(k){
    //   client.emit('userEntered', {'userId': broadcasterList[k].id});
    // });

    client.on('watch', function(broadcasterId){
      broker.addWatcher(broadcasterId, client);
      console.log(user.username+'('+client.id+')'+' requested to watch: '+broadcasterId);
      broker.getStreamId(broadcasterId).emit('startStreaming');
    });

    client.on('unwatch', function() {
      console.log(user.username+ " left ("+client.id+")");

      var bro = broker.removeWatcher(client);
      console.log("left: "+bro);

      if (bro != null && !broker.hasMoreWatchers(bro)) {
        broker.getStreamId(bro).emit('stopStreaming');
      }
    });

    client.on('disconnect', function() {
      console.log('goodbye admin:'+user.username);
      client.disconnect();
      delete adminList[user.id];
    });

    client.on('getBroadcasters', function(fn) {
      var broadcasterList = broker.getBroadcasters();
      console.log(Object.keys(broadcasterList));
      fn({'broadcasters': Object.keys(broadcasterList)} );
    });

    client.on('dump', function() {
      console.log(broker.dump());
    });

    return null;
  }
};
