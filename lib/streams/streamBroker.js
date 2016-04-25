module.exports = function() {

  var Stream = function(streamId, userData) {
    return {
      streamId: streamId,
      userData: userData,
      watchers: [],
      watchersIds: [],
      streaming: false
    }
  }

  var connectedBroadcasters = {};

  var _removeWatcher = function(watcherClient) {
    var found = null;
    Object.keys(connectedBroadcasters).forEach(function(k){
      //console.log("R) broacaster: "+k);
      var wlistIds = connectedBroadcasters[k].watchersIds;
      var wlist = connectedBroadcasters[k].watchers;
      //console.log(wlistIds);
      //console.log(watcherClient.id);
      var pos = wlistIds.indexOf(watcherClient.id);
      if (pos > -1) {
        //console.log("Found: "+watcherClient.id);
        wlistIds.splice(pos, 1);
        wlist.splice(pos, 1);
        found = k;
      }
    });
    return found;
  };


  return {

    dump : function() {
      console.log(connectedBroadcasters);
    },

    addWatcher : function(broadcasterId, watcherClient) {
      if (! (broadcasterId in connectedBroadcasters))
        return false;

      //clear all other interests
      Object.keys(connectedBroadcasters).forEach(function(e){
        _removeWatcher(watcherClient);
      });

      if (!(watcherClient in connectedBroadcasters[broadcasterId])) {

        var client = {};
        client['id'] = watcherClient.id;
        client['socket'] = watcherClient;
        connectedBroadcasters[broadcasterId].watchers.push(watcherClient);
        connectedBroadcasters[broadcasterId].watchersIds.push(watcherClient.id);
      }


      return true;
    },

    addBroadcaster: function(streamerId, userData) {

      if (streamerId == null)
        throw 'streamId cannot be null';

      if (userData.id in connectedBroadcasters)
        console.warn('Broadcaster connection already registered. Overriding');

      connectedBroadcasters[userData.id] = new Stream(streamerId, userData);
    },

    removeBroadcaster: function(broadcasterId) {
      if (broadcasterId in connectedBroadcasters)
        delete connectedBroadcasters[broadcasterId];
      else
        console.warn('Tried to disconnect missing broadcaster');
    },

    getStreamId: function(broadcasterId) {

      if (!(broadcasterId in connectedBroadcasters))
        throw 'Broadcaster not connected';

      return connectedBroadcasters[broadcasterId].streamId;
    },

    removeWatcher: function(watcherClient) {

      var found = _removeWatcher(watcherClient);

      if (!found)
        console.warn('Removing non-existing watcherClient: ');
        //console.warn(watcherClient);

      return found;

    },

    hasMoreWatchers: function(broadcasterId) {
      return (connectedBroadcasters[broadcasterId].watchers.length > 0);
    },

    getWatchers : function(broadcasterId) {
      if (! (broadcasterId in connectedBroadcasters)) {
        console.error('Requesting watchers for missing broadcaster');
        return [];
      }
      return connectedBroadcasters[broadcasterId].watchers;
    },

    getBroadcasters : function() {
      var out = {};
      Object.keys(connectedBroadcasters).forEach(function(bid) {
        out[bid] = connectedBroadcasters[bid].userData;
      });
      return out;
    }
  };

};
