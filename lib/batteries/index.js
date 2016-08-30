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
      row = db.battery.parseRequest(bat, {userId: user.id});

      if (!row) {
        return false;
      }

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
