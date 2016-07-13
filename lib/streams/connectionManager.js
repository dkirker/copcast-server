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
        var old_socket = connectionMapper.admin[user.id];
        delete reverseConnectionMapper.admin[old_socket.id];
        this.removeWatcher(old_socket.id);
        console.warn('removed old socket: '+old_socket.id);
      }

      connectionMapper.admin[user.id] = socket;
      reverseConnectionMapper.admin[socket.id] = user;
    },

    addAndroid : function (user, socket) {

      if (user.id in connectionMapper.android) { // user returned but old connection remained
        var old_socket = connectionMapper.android[user.id];
        delete reverseConnectionMapper.android[old_socket.id];
      }

      socket.copcast.watchersList = [];
      connectionMapper.android[user.id] = socket;
      reverseConnectionMapper.android[socket.id] = user;
    },

    removeAdminBySocketId : function (socket_id) {

      var user = reverseConnectionMapper.admin[socket_id];

      if (!user) {
          console.log(Object.keys(connectionMapper.admin));
          console.log(Object.keys(reverseConnectionMapper.admin));
        console.warn('Trying to remove socket_id: '+socket_id);
        return;
      }

      var test_socket = connectionMapper.admin[user.id];

      if (socket_id == test_socket.id) {
        // we are in consistent state
        delete connectionMapper.admin[user.id];
      }

      delete reverseConnectionMapper.admin[socket_id];
      // this.removeAdminBySocketId(socket_id);
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
      var dirmapadmin = Object.keys(connectionMapper.admin).map(function(k){ r={}; r[k]=connectionMapper.admin[k].id; return r;});
      var revmapadmin = Object.keys(reverseConnectionMapper.admin).map(function(k){ r={}; r[k]=reverseConnectionMapper.admin[k].id; return r;});
      var dirmapandroid = Object.keys(connectionMapper.android).map(function(k){ r={}; r[k]=connectionMapper.android[k].id; return r;});
      var revmapandroid = Object.keys(reverseConnectionMapper.android).map(function(k){ r={}; r[k]=reverseConnectionMapper.android[k].id; return r;});
      return {'admin': {'direct': dirmapadmin, 'reverse': revmapadmin}, 'android': {'direct': dirmapandroid, 'reverse': revmapandroid}};
    }
  }
};
