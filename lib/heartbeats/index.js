/**
 * Created by brunosiqueira on 13/10/15.
 */
var express = require('express'),
  app = module.exports = express(),
  db = require('./../db'),
  signing = require('./../signing'),
  auth = require('./../auth'),
  config = require('./../config');

app.post("/heartbeats", auth.ensureUser, signing.verify, function (req, res) {

  var location = req.body.location;
  var battery = req.body.battery;

  var connectedSockets = Object.keys(app.get('sockets').connected);
  for (var i = 0; i < connectedSockets.length; i++) {
    var socket = app.get('sockets').connected[connectedSockets[i]];
    if (socket.copcast.clientType == 'admin' && (socket.copcast.group.id == req.user.groupId || socket.copcast.group.isAdmin)) {
      socket.emit('users:heartbeat', { id : req.user.id, name: req.user.name, username: req.user.username,
        location: location, battery: battery, profilePicture: req.user.profilePicture});
    }
  }

  req.user.lastLat = location.lat;
  req.user.lastLng = location.lng;
  req.user.lastLocationUpdateDate = location.date = new Date();
  req.user.save().then(function(user) {

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
        db.battery.findOne({where: {userId: req.user.id, date: battery.date}}).then(function(b) {
          if (!b) {
            var batteryObj = db.battery.build({
              batteryPercentage: battery.batteryPercentage,
              batteryHealth: battery.batteryHealth,
              date: battery.date,
              plugged: battery.plugged,
              temperature: battery.temperature,
              userId: req.user.id
            });

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
