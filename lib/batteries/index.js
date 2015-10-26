var express = require('express'),
  app = module.exports = express(),
  db = require('./../db'),
  _ = require('lodash'),
  auth = require('./../auth'),
  config = require('./../config');

function containsElement(array, el){
  var found = false;
  for(var i = 0; i < array.length; i++) {
    if (array[i].date == el.date) {
      found = true;
      break;
    }
  }
  return found;
}
app.post('/batteries/:user', auth.ensureUser, function(req,res) {
  var batteries = []
  _.forEach(req.body, function (bat) {
    bat.userId = req.user.id;
    if (!containsElement(batteries, bat)) {
      batteries.push(bat);
    }
  });

  db.battery.bulkCreate(batteries)
    .then(function(result) {
      res.sendStatus(200);
    }).error(function(err) {
      console.log(err);
      res.sendStatus(500);
    });
});
