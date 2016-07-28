var config = require('./../config');
var db = require('./../db');

var save_heartbeat = function(user, data) {
  var location = data.location;
  var battery = data.battery;

  user.lastLat = location.lat;
  user.lastLng = location.lng;
  user.lastLocationUpdateDate = location.date = new Date();
  user.save().then(function(user) {

    var locationObj = db.location.build({
      lat: location.lat,
      lng: location.lng,
      date: location.date,
      accuracy: location.accuracy,
      satellites: location.satellites,
      provider: location.provider,
      bearing: location.bearing,
      speed: location.speed,
      userId: user.id
    });

    locationObj.save().then(function() {

      if (battery) {
        db.battery.findOne({where: {userId: user.id, date: battery.date}}).then(function(b) {
          if (!b) {
            var batteryObj = db.battery.build({
              batteryPercentage: battery.batteryPercentage,
              batteryHealth: battery.batteryHealth,
              date: battery.date,
              plugged: battery.plugged,
              temperature: battery.temperature,
              userId: user.id
            });

            batteryObj.save().then(function() {
              return null;
            }).catch(function(err){
              return console.error(err);
            });
            return null;
          }

        }).catch(function(err){
          return console.error(err);
        });
        return null;
      }
    }).catch(function(err){
      return console.error(err);
    });
    return null;
  }).catch(function(err){
    return console.error(err);
  });
  return null;
}

module.exports = function(io,auth, streams) {

  var heartbeatCache = {};

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

    socket.copcast.clientType = handshake._query.clientType;
    // socket.copcast.user = user;
    console.log('-- ' + socket.id + ' joined -- '+handshake._query.userId + ' as ' + socket.copcast.clientType);

  });

  io.on('connection', function (socket) {

    auth.validateToken(socket.copcast.token, function (err, user, info) {
      socket.copcast.user = user;
      console.log('new connection with socketId: '+socket.id);

      user.getGroup().then(function (group) {
        socket.copcast.group = group;

        // admin groups are put together on a single admin room
        // regular groups are separated into disjoint rooms
        if (socket.copcast.group.isAdmin)
          socket.copcast.group_room = 'group_admin';
        else
          socket.copcast.group_room = 'group_'+socket.copcast.group.id;

        if (socket.copcast.clientType == 'android') {
          handleAndroid(socket);
        } else if (socket.copcast.clientType == 'admin') {
          handleAdmin(socket);
        } else {
          console.error("Invalid clientType: " + socket.copcast.clientType);
          // console.log(socket);
        }
      });

    });
  });

  var broadcast_to_groups = function(socket, event, payload) {
    socket.broadcast.to(socket.copcast.group_room).emit(event, payload);
    if (socket.copcast.group_room != 'group_admin')
      socket.broadcast.to('group_admin').emit(event, payload);
  }

  var handleAndroid = function(socket) {
    var user = socket.copcast.user;
    console.log("connected android: "+user.name + '('+user.id+')');

    // every android joins a broadcasting room for its own streaming
    socket.copcast.live_room = "live_"+user.id;
    socket.join(socket.copcast.live_room);
    socket.join(socket.copcast.group_room);

    broadcast_to_groups(socket, 'userEntered', {'userId': user.id});

    socket.on('disconnect', function() {
      console.log('disconnected android: '+user.username + '('+user.id+')');
      broadcast_to_groups(socket, 'userLeft', {'userId': user.id});

      io.in('live_'+socket.copcast.user.id).clients(function(err, clients) {
        clients.forEach(function(sockId){
          var conn_socket = io.sockets.connected[sockId];
          conn_socket.leave('live_' + socket.copcast.user.id);
        });
      });

      //clear location cache
      if (socket.copcast.user.id in heartbeatCache) {
        delete heartbeatCache[socket.copcast.user.id];
      }

    });

    socket.on('missionPaused', function() {
      console.log('mission paused: '+user.username + '('+user.id+')');
      broadcast_to_groups(socket, 'missionPaused', {'userId': user.id});

    });

    socket.on('missionResumed', function() {
      console.log('mission resumed: '+user.username + '('+user.id+')');
      broadcast_to_groups(socket, 'missionResumed', {'userId': user.id});
    });

    socket.on('startStreamingRequest', function() {
      console.log('android request streaming: '+user.username + '('+user.id+')');
      broadcast_to_groups(socket, 'startStreamingRequest', {'userId': user.id});
    });

    socket.on('stopStreamingRequest', function() {
      console.log('android cancelled streaming request: '+user.username + '('+user.id+')');
      broadcast_to_groups(socket, 'stopStreamingRequest', {'userId': user.id});
    });

    socket.on('streamDenied', function() {
      console.log('android denying stream'+user.username + '('+user.id+')');
      socket.broadcast.to(socket.copcast.live_room).emit('streamDenied', {id: user.id, name: user.name});
    });

    socket.on('streamStopped', function() {
      console.log('notify streaming stopped: '+user.username + '('+user.id+')');
      broadcast_to_groups(socket, 'streamStopped', {'userId': user.id});
    });

    socket.on('streamStarted', function() {
      console.log('notify streaming started: '+user.username + '('+user.id+')');
      broadcast_to_groups(socket, 'streamStarted', {'userId': user.id});
    });

    socket.on('frame', function(data) {
      socket.broadcast.to(socket.copcast.live_room).emit('frame', {frame: data});
    });

    socket.on('heartbeat', function(data){

      save_heartbeat(socket.copcast.user, data);

      var udata =  {
        id: socket.copcast.user.id,
        name: socket.copcast.user.name,
        username: socket.copcast.user.username,
        location: data.location,
        battery: data.battery,
        groupId: socket.copcast.user.groupId,
        groupName: socket.copcast.group.name,
        state: data.state,
        profilePicture: socket.copcast.user.profilePicture
      };

      heartbeatCache[udata.id] = udata;
      broadcast_to_groups(socket, 'users:heartbeat', udata);
    });
  };

  var unwatch = function(_socket) {
    Object.keys(io.sockets.adapter.rooms).forEach(function(room_name){ //all rooms this socket is connected to
      if (room_name.indexOf('live_')>=0) { // any live_N room?
        io.in(room_name).clients(function(error, clients){
          console.log(clients);
          console.log(_socket.id);
          if (clients.length==1 || (clients.length==2 && clients.indexOf(_socket.id)>=0)) {
            io.sockets.connected[clients[0]].emit('stopStreaming');
          }
          _socket.leave(room_name);

        });
        return true;
      }
    });
  }

  var handleAdmin = function(socket) {
    console.log("admin entered: "+socket.copcast.user.username);

    socket.join(socket.copcast.group_room);

    socket.on('watch', function(android_user_id){

      if (io.sockets.adapter.rooms['live_'+android_user_id].length == 0) {
        console.warn("ABNORMAL: User "+socket.copcast.user.username+' requested to watch unlisted mobile: '+android_user_id);
        return;
      }

      var mobile_socket = null;
      for (var socketId in io.in('live_'+android_user_id).clients().connected) {
        var conn_socket = io.in('live_'+android_user_id).clients().connected[socketId];
        if (conn_socket.copcast.user.id == android_user_id && conn_socket.copcast.clientType=='android') {
          mobile_socket = conn_socket;
          break;
        }
      }

      if (!mobile_socket) {
        console.warn("ABNORMAL: User "+socket.copcast.user.username+' requested to watch non-existing mobile: '+android_user_id);
        return;
      }

      if (!socket.copcast.group.isAdmin && mobile_socket.copcast.group.id != socket.copcast.group.id) {
        console.warn("ABNORMAL: User "+socket.copcast.user.username+' requested to watch unauthorized mobile: '+android_user_id);
        return;
      }

      console.log('joining: '+android_user_id);
      socket.join('live_'+android_user_id);

      mobile_socket.emit('startStreaming');
    });

    socket.on('unwatch', function() {
      unwatch(socket);
    });

    socket.on('disconnect', function() {
      unwatch(socket);
      console.log('goodbye admin:'+socket.copcast.user.username);
    });

    socket.on('getBroadcasters', function(fn) {

      var broadcastersIdList = [];

      var rooms_base = [];

      console.log("----");

      var all_rooms = Object.keys(io.sockets.adapter.rooms).filter(function(n){
        if (n.indexOf('group_')==0)
          return n;
      });

      if (!socket.copcast.group.isAdmin) {
        rooms_base.push("group_" + socket.copcast.group.id);
      } else {
        rooms_base = all_rooms;
      }

      console.log("user: "+socket.copcast.user.username+' requesting groups: '+JSON.stringify(rooms_base));

      io.clients(function(err, clients) {

        clients.forEach(function(client_id) {

          var s = io.sockets.connected[client_id];
          if (s.copcast.clientType == "android") {
            var s_rooms = Object.keys(s.rooms);
            for (var ir in rooms_base) {
              for (var ur in s_rooms) {
                if (rooms_base[ir] == s_rooms[ur]) {
                  // broadcastersIdList.push(s.copcast.user.id);
                  broadcastersIdList.push(heartbeatCache[s.copcast.user.id]);
                  return;
                }
              }
            }
          }
        });
        fn({'broadcasters': broadcastersIdList} );
      });
    });

    socket.on('dump', function(fn) {
      console.warn("dump requested");
    });

    return null;
  }
};
