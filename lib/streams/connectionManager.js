var config = require('./../config');


module.exports = function() {


  var connectionMapper = {};
  connectionMapper.admin = {};
  connectionMapper.android = {};

  var reverseConnectionMapper = {};
  reverseConnectionMapper.admin = {};
  reverseConnectionMapper.android = {};

  return {

    addAdmin : function (user, socket) {
      connectionMapper.admin[user.id] = socket;
      reverseConnectionMapper.admin[socket.id] = user;
    },

    addAndroid : function (user, socket) {
      connectionMapper.android[user.id] = socket;
      reverseConnectionMapper.android[socket.id] = user;
      socket.copcast.watchersList = [];
    },

    removeAdminByUserId : function (user_id) {
      var socket = connectionMapper.admin[user_id];
      delete reverseConnectionMapper.admin[socket.id];
      delete connectionMapper.admin[user_id];
    },

    removeAndroidByUserId : function (user_id) {
      var socket = connectionMapper.android[user_id];
      delete reverseConnectionMapper.android[socket.id];
      delete connectionMapper.android[user_id];
    },

    removeAdminBySocketId : function (socket_id) {
      var user = reverseConnectionMapper.admin[socket_id];
      delete reverseConnectionMapper.admin[socket_id];
      delete connectionMapper.admin[user.id];
    },

    removeAndroidBySocketId : function (socket_id) {
      var user = reverseConnectionMapper.android[socket_id];
      delete reverseConnectionMapper.android[socket_id];
      delete connectionMapper.android[user.id];
      return user;
    },

    getSocketByUserId : function (user_id) {
      if (user_id in Object.keys(connectionMapper.admin))
        return connectionMapper.admin[user_id];
      else
        return connectionMapper.android[user_id];
    },

    getUserBySocketId : function (socket_id) {
      if (socket_id in Object.keys(reverseConnectionMapper.admin))
        return reverseConnectionMapper.admin[socket_id];
      else
        return reverseConnectionMapper.android[socket_id];
    },

    getAndroidUsers : function() {
      return Object.keys(reverseConnectionMapper.android).map(function(k){return reverseConnectionMapper.android[k]});
    },

    getAndroidSockets : function() {
      return Object.values(reverseConnectionMapper.android);
    },

    emitToAdmins: function(event, payload) {
      Object.values(reverseConnectionMapper.admin).forEach(function (admin_socket) {
        admin_user = connMap.getUserBySocketId(admin_socket.id);
        console.log('notify [' + event + '] to: ' + admin_user.name + '(' + admin_user.id + ')');
        admin_socket.emit(event, payload);
      });
    },

    getWatchedSocket : function(admin_socket_id) {
      var watched_socket = null;
      var watcher_index = -1;
      Object.keys(connectionMapper.android).some(function(android_user_id){
        var android_socket = connectionMapper.android[android_user_id];
        var watchting_admin_ids = android_socket.copcast.watchersList.map(function(s) {return s.id});
        if (admin_socket_id in watchting_admin_ids) {
          watched_socket = android_socket;
          watcher_index = watchting_admin_ids.indexOf(admin_socket_id);
          return true;
        } else {
          return false;
        }
      });
      return {'watched_socket': watched_socket, 'watcher_index': watcher_index};
    },

    removeWatcher : function(watcher_socket_id) {
      var tmp = this.getWatchedSocket(watcher_socket_id);
      var watchedSocket = tmp.watched_socket;
      var watcherIdIndex = tmp.watcher_index;

      if (watcherIdIndex > -1) {
        watchedSocket.copcast.watchersList.splice(watcherIdIndex, 1);
      }

      return watchedSocket;
    },

    addToWatchersList : function(watched_id, watcher_socket) {
      this.removeWatcher(watcher_socket.id);
      android_socket.copcast.watchersList.push(watcher_socket);
    }
  }
};
