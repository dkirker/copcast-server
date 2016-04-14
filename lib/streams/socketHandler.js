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



    console.log('-- ' + client.id + ' joined -- '+handshake.query.userId + ' as ' + clientType);
    db.user.findById(handshake.query.userId).then(function (user) {

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
        console.log('emitting to: '+uid);
        adminList[uid].emit('userLeft', {'userId': user.id});
      });
    });

    client.on('connect_timeout', function() {
      console.log('timed out');
      client.emit('disconnect');
    });

    client.on('streamStopped', function() {
      broker.getWatchers(user.id).forEach(function(socket) {
        socket.emit('streamStopped');
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

    setTimeout(function() {
      client.emit('teste', 'lixo');
    }, 3000);


    var broadcasterList = broker.getBroadcasters();
    Object.keys(broadcasterList).forEach(function(k){
      client.emit('userEntered', {'userId': broadcasterList[k].id});
    });

    client.on('watch', function(broadcasterId){
      broker.addWatcher(broadcasterId, client);
      console.log(client.id+" entered for: "+broadcasterId);
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
      console.log('goodbye '+user.username);
      client.disconnect();
      delete adminList[user.id];
    });

    return null;
  }
};
