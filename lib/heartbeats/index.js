/**
 * Created by brunosiqueira on 13/10/15.
 */
var express = require('express'),
  app = module.exports = express(),
  db = require('./../db'),
  _ = require('lodash'),
  auth = require('./../auth'),
  Sequelize = require('sequelize'),
  config = require('./../config'),
  sequelize = new Sequelize(config.db, { dialect : 'postgres', logging: false, omitNull: true/*,logging: console.log*/ });

app.post("/heartbeats", auth.ensureAdmin, function (req, res) {

  var location = req.body.location;
  var battery = req.body.battery;

  req.user.lastLat = location.lat;
  req.user.lastLng = location.lng;
  req.user.lastLocationUpdateDate = location.date = new Date();
  req.user.save();
  var locationObj = db.location.build({
    lat: location.lat,
    lng: location.lng,
    date: location.date,
    accuracy: location.accuracy,
    satellites: location.satellites,
    provider: location.provider,
    bearing: location.bearing,
    speed: location.speed
  });

  locationObj.save().then(function(){
    locationObj.setUser(req.user);
  });

  if (battery){
    db.battery.findOne({where: {userId: req.user.id, date: battery.date}}).then(function(battery){
      if (battery){
        var batteryObj = db.battery.build({
          batteryPercentage: battery.batteryPercentage,
          batteryHealth: battery.batteryHealth,
          date: battery.date,
          plugged: battery.plugged,
          temperature: battery.temperature
        });

        batteryObj.save().then(function() {
          batteryObj.setUser(req.user);
        });
      }
    });

  }

  app.get('sockets').emit('users:heartbeat', { id : req.user.id, name: req.user.name, username: req.user.username,
    location: location, battery: battery});
  req.body = [req.body];
  res.sendStatus(200);
});
