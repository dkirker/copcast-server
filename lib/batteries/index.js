var express = require('express'),
  app = module.exports = express(),
  db = require('./../db'),
  _ = require('lodash'),
  auth = require('./../auth'),
  signing = require('./../signing'),
  config = require('./../config');

function containsElement(array, el){
  var found = false;
  for(var i = 0; i < array.length; i++) {
    if (array[i].date === el.date) {
      found = true;
      break;
    }
  }
  return found;
}

app.post('/batteries/:user', auth.ensureToken, signing.verify, function(req,res) {

  if (!('bulk' in req.body) || !Array.isArray(req.body.bulk)) {
    console.log("Missing bulk data in batteries for user: "+req.params.user);
    return res.sendStatus(400);
  }
  db.user.find({where: {username: req.params.user}}).then(function(user){
    if (user == null)
      return res.sendStatus(404);

    var batteries = [], row;
    if ( !req.body.bulk.some(function (bat) {
      row = {userId: user.id};

      //Validate the battery object
      if (!('batteryHealth' in bat) ||
          !('batteryPercentage' in bat) ||
          !('temperature' in bat) ||
          !('status' in bat) ||
          !('plugged' in bat) ||
          !('date' in bat) ||
          (typeof bat['batteryHealth'] != 'number') ||
          (typeof bat['batteryPercentage'] != 'number') ||
          (typeof bat['temperature'] != 'number') ||
          (typeof bat['status'] != 'number') ||
          (typeof bat['plugged'] != 'number') ||
          (typeof bat['date'] != 'string')) {
        return false;
      }

      row.batteryHealth = bat.batteryHealth;
      row.batteryPercentage = bat.batteryPercentage;
      row.temperature = bat.temperature;
      row.status = bat.status;
      row.plugged = bat.plugged;
      row.date = bat.date;

      if (!containsElement(batteries, row)) {
        batteries.push(row);
      }
      return true;
    })) {
      return res.sendStatus(400);
    }

    db.battery.bulkCreate(batteries)
      .then(function() {
        return res.sendStatus(201);
      }).catch(function(err) {
        console.log(err);
        return res.sendStatus(500);
      });
  });
});
