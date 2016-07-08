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

      if (user.id in connectionMapper.admin) { // user returned but old connection remained
        var socketId = connectionMapper.admin[user.id].id;
        delete connectionMapper.admin[user.id];
        delete reverseConnectionMapper.admin[socketId];
      }

      connectionMapper.admin[user.id] = socket;
      reverseConnectionMapper.admin[socket.id] = user;
    },

    addAndroid : function (user, socket) {

      if (user.id in connectionMapper.android) { // user returned but old connection remained
        var socketId = connectionMapper.android[user.id].id;
        delete connectionMapper.android[user.id];
        delete reverseConnectionMapper.android[socketId];
      }

      socket.copcast.watchersList = [];
      connectionMapper.android[user.id] = socket;
      reverseConnectionMapper.android[socket.id] = user;
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

    getAndroidSocketByUserId : function (user_id) {
        return connectionMapper.android[user_id];
    },

    getUserBySocketId : function (socket_id) {
      if (socket_id in reverseConnectionMapper.admin) {
        return reverseConnectionMapper.admin[socket_id];
      } else if (socket_id in reverseConnectionMapper.android) {
        return reverseConnectionMapper.android[socket_id];
      } else {
        return null;
      }

    },

    getAndroidUsers : function() {
      return Object.keys(reverseConnectionMapper.android).map(function(k){return reverseConnectionMapper.android[k]});
    },

    getAndroidSockets : function() {
      return Object.values(reverseConnectionMapper.android);
    },

    emitToAdmins: function(event, payload) {
      var self = this;
      Object.keys(connectionMapper.admin).map(function(k) {return connectionMapper.admin[k]}).forEach(function (admin_socket) {
        var admin_user = self.getUserBySocketId(admin_socket.id);
        admin_socket.emit(event, payload);
      });
    },

    getWatchedSocket : function(admin_socket_id) {
      var watched_socket = null;
      var watcher_index = -1;
      Object.keys(connectionMapper.android).some(function(android_user_id){
        var android_socket = connectionMapper.android[android_user_id];
        var watchting_admin_ids = android_socket.copcast.watchersList.map(function(s) {return s.id});
        if (watchting_admin_ids.indexOf(admin_socket_id)>=0) {
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
      var android_socket = this.getAndroidSocketByUserId(watched_id);
      android_socket.copcast.watchersList.push(watcher_socket);
    },

    dump: function() {
      return {'direct': connectionMapper, 'reverse': reverseConnectionMapper};
    }
  }
};
