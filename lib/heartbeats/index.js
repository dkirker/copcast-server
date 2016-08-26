/**
 * Created by brunosiqueira on 13/10/15.
 */
var express = require('express'),
  app = module.exports = express(),
  db = require('./../db'),
  signing = require('./../signing'),
  auth = require('./../auth'),
  config = require('./../config'),
  Promise = require('promise');

function getGroupNameFromHeartbeat(req) {
  var connectedSockets = app.get('sockets').connected;
  var connectedSocketKeys = Object.keys(connectedSockets);
  for (var i = 0; i < connectedSocketKeys.length; i++) {
    var socket = connectedSockets[connectedSocketKeys[i]];
    //if(socket.copcast.group.id == req.user.groupId) {
    //  // Found a connected socket for this groupId, return the groupName
    //  return Promise.resolve(socket.copcast.group.name);
    //}
  }
  // Connected socket not found for this user, look up group record
  return req.user.getGroup().then(function (group) {
    return group.name;
  });
}

function updateConnectedAdminSockets(req, location, battery, state) {
  getGroupNameFromHeartbeat(req).then(function (groupName) {
    var connectedSockets = app.get('sockets').connected;
    var connectedSocketKeys = Object.keys(connectedSockets);
    for (var i = 0; i < connectedSocketKeys.length; i++) {
      var socket = connectedSockets[connectedSocketKeys[i]];
      //if (socket.copcast.clientType == 'admin' && (socket.copcast.group.id == req.user.groupId || socket.copcast.group.isAdmin)) {
      if (socket.copcast.clientType == 'admin') {
        var data =  {
          id: req.user.id,
          name: req.user.name,
          username: req.user.username,
          location: location,
          battery: battery,
          groupId: req.user.groupId,
          groupName: groupName,
          state: state,
          profilePicture: req.user.profilePicture
        };
        socket.emit('users:heartbeat', data);
      }
    }
  });
}

app.post("/heartbeats", auth.ensureUser, signing.verify, function (req, res) {
  var location = db.location.parseRequest(req.body.location);
  if (!location) {
    return res.sendStatus(400);
  }
  var battery = db.battery.parseRequest(req.body.battery);
  if (!battery) {
    return res.sendStatus(400);
  }
  var state = req.body.state;
  updateConnectedAdminSockets(req, location, battery, state);

  req.user.lastLat = location.lat;
  req.user.lastLng = location.lng;
  req.user.lastLocationUpdateDate = location.date = new Date();
  req.user.save().then(function(user) {
    location.userId = user.id;
    var locationObj = db.location.build(location);
    locationObj.save().then(function() {

      if (battery) {
        db.battery.findOne({where: {userId: req.user.id, date: battery.date}}).then(function(b) {
          if (!b) {
            battery.userId = req.user.id;
            var batteryObj = db.battery.build(battery);

            batteryObj.save().then(function() {
              return res.sendStatus(201);
            }).catch(function(err){
              console.error(err);
              return res.sendStatus(500);
            });
            return null;
          } else {
            return res.sendStatus(201)
          }

        }).catch(function(err){
          console.error(err);
          return res.sendStatus(500);
        });
        return null;
      } else {
        return res.sendStatus(201);
      }

      //req.body = [req.body];

    }).catch(function(err){
      console.error(err);
      return res.sendStatus(500);
    });
    return null;
  }).catch(function(err){
    console.error(err);
    return res.sendStatus(500);
  });
  return null;
});
