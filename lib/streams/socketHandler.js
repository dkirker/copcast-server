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

    // connMap.addAndroid(user, socket);
    // connMap.emitToAdmins('userEntered', {'userId': user.id});
    broadcast_to_groups(socket, 'userEntered', {'userId': user.id});

    socket.on('disconnect', function() {
      console.log('disconnected android: '+user.username + '('+user.id+')');
      // connMap.emitToAdmins('userLeft', {'userId': user.id});
      // connMap.removeAndroidByUserId(user.id);
      broadcast_to_groups(socket, 'userLeft', {'userId': user.id});
      // io.sockets.clients('live_'+socket.copcast.user.id).forEach(function(watcher_socket){
      //   watcher_socket.leave('live_'+socket.copcast.user.id);
      // });

      io.in('live_'+socket.copcast.user.id).clients(function(err, clients) {
        clients.forEach(function(sockId){
          var conn_socket = io.sockets.connected[sockId];
          conn_socket.leave('live_' + socket.copcast.user.id);
        });
      });

    });

    socket.on('missionPaused', function() {
      console.log('mission paused: '+user.username + '('+user.id+')');
      // connMap.emitToAdmins('missionPaused', {'userId': user.id});
      broadcast_to_groups(socket, 'missionPaused', {'userId': user.id});

    });

    socket.on('missionResumed', function() {
      console.log('mission resumed: '+user.username + '('+user.id+')');
      // connMap.emitToAdmins('missionResumed', {'userId': user.id});
      broadcast_to_groups(socket, 'missionResumed', {'userId': user.id});
    });

    socket.on('startStreamingRequest', function() {
      console.log('android request streaming: '+user.username + '('+user.id+')');
      // connMap.emitToAdmins('startStreamingRequest', {'userId': user.id});
      broadcast_to_groups(socket, 'startStreamingRequest', {'userId': user.id});
    });

    socket.on('stopStreamingRequest', function() {
      console.log('android cancelled streaming request: '+user.username + '('+user.id+')');
      // connMap.emitToAdmins('stopStreamingRequest', {'userId': user.id});
      broadcast_to_groups(socket, 'stopStreamingRequest', {'userId': user.id});
    });

    socket.on('streamDenied', function() {
      console.log('android denying stream'+user.username + '('+user.id+')');
      // socket.copcast.watchersList.forEach(function(watcher_socket){
      // watcher_socket.emit('streamDenied', {id: user.id, name: user.name});
      // });
      socket.broadcast.to(socket.copcast.live_room).emit('streamDenied', {id: user.id, name: user.name});
    });

    socket.on('streamStopped', function() {
      console.log('notify streaming stopped: '+user.username + '('+user.id+')');
      // connMap.emitToAdmins('streamStopped', {'userId': user.id});
      broadcast_to_groups(socket, 'streamStopped', {'userId': user.id});
    });

    socket.on('streamStarted', function() {
      console.log('notify streaming started: '+user.username + '('+user.id+')');
      // connMap.emitToAdmins('streamStarted', {'userId': user.id});
      broadcast_to_groups(socket, 'streamStarted', {'userId': user.id});
    });

    socket.on('frame', function(data) {
      //broadcasting to watchers
      // socket.copcast.watchersList.forEach(function(watching_socket){
      // watching_socket.emit('frame', {frame: data});
      // });
      socket.broadcast.to(socket.copcast.live_room).emit('frame', {frame: data});
    });
  };


  var handleAdmin = function(socket) {
    console.log("admin entered: "+socket.copcast.user.username);
    // connMap.addAdmin(user, socket);

    socket.join(socket.copcast.group_room);

    // var unwatch = function(watcher_socket, watcher_user) {
    //
    //   var watched_socket = connMap.removeWatcher(watcher_socket.id);
    //   if (!watched_socket)
    //     return;
    //   var watched_user = connMap.getUserBySocketId(watched_socket.id);
    //   console.log(watcher_user.name+ "("+watcher_user.id+") unwatch "+watched_user.name+" ("+watched_user.id+")");
    //   var remaining_watchers = watched_socket.copcast.watchersList;
    //
    //   if (remaining_watchers.length == 0) {
    //     console.log('no more watchers on '+watched_user.name+" ("+watched_user.id+")");
    //     watched_socket.emit('stopStreaming');
    //   }
    // }

    // Object.keys(broadcasterList).forEach(function(k){
    //   client.emit('userEntered', {'userId': broadcasterList[k].id});
    // });

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

      // var android_socket = connMap.getAndroidSocketByUserId(android_user_id);
      // //android_socket.copcast.watchersList.push(socket);
      // connMap.addToWatchersList(android_user_id, socket);
      // console.log(user.name+'('+user.id+')'+' requested to watch: '+android_user_id);
      mobile_socket.emit('startStreaming');
    });

    socket.on('unwatch', function() {
      // unwatch(socket, user);

      var watched_room = null;
      Object.keys(socket.rooms).some(function(room_name){ //all rooms this socket is connected to
        if (room_name.indexOf('live_')>=0) { // any live_N room?
          socket.leave(room_name, function(err){
            console.log("unwatching room: "+room_name);
            io.in(room_name).clients(function(error, clients){
              console.log(clients);
              if (clients.length==1) {
                io.sockets.connected[clients[0]].emit('stopStreaming');
              }
            });
          });
          return true;
        }
      });


    });

    socket.on('disconnect', function() {
      console.log('goodbye admin:'+socket.copcast.user.username);
      // unwatch(socket, user);
      // connMap.removeAdminByUserId(user.id);
      // connMap.removeAdminBySocketId(socket.id);
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
                  console.log("ur: " + s_rooms[ur]);
                  console.log("ir: " + rooms_base[ir]);
                  console.log(s.id);
                  broadcastersIdList.push(s.copcast.user.id);
                  return;
                }
              }
            }
          }
        });
        console.log('broadcasters: '+JSON.stringify(broadcastersIdList));
        // var broadcastersIdList = connMap.getAndroidUsers().map(function(u){return u.id});
        fn({'broadcasters': broadcastersIdList} );

      });

      // console.log(all_rooms);
      //
      // if (!socket.copcast.group.isAdmin) {
      //   rooms_base.push("group_" + socket.copcast.group.id);
      // } else {
      //   rooms_base = all_rooms;
      // }
      //
      // console.log('room_base'+JSON.stringify(rooms_base));
      //
      // console.log(rooms_base);
      // rooms_base.forEach(function(room_name) {
      //   console.log('>'+room_name);
      //   io.in(room_name).clients(function(error, clients){
      //     console.log('>'+JSON.stringify(clients));
      //     clients.forEach(function(socketId) {
      //       console.log('>>'+socketId);
      //       var conn_socket = io.sockets.connected[socketId];
      //       if (conn_socket.copcast.clientType == 'android')
      //         broadcastersIdList.push(conn_socket.copcast.user.id);
      //     });
      // console.log('broadcasters: '+JSON.stringify(broadcastersIdList));
      // // var broadcastersIdList = connMap.getAndroidUsers().map(function(u){return u.id});
      // fn({'broadcasters': broadcastersIdList} );

      //   });
      // });

    });

    socket.on('dump', function(fn) {
      console.warn("dump requested");
      // fn({'dump': connMap.dump()});
    });

    return null;
  }
};
