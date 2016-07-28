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

  if (!('bulk' in req.body)) {
    console.log("Missing bulk data in batteries for user: "+req.params.user);
    return res.sendStatus(500);
  }

  db.user.find({where: {username: req.params.user}}).then(function(user){
    if (user == null)
      return res.sendStatus(404);

    var batteries = []
    _.forEach(req.body.bulk, function (bat) {
      bat.userId = user.id;
      if (!containsElement(batteries, bat)) {
        batteries.push(bat);
      }
    });

    db.battery.bulkCreate(batteries)
      .then(function() {
        return res.sendStatus(201);
      }).catch(function(err) {
        console.log(err);
        return res.sendStatus(500);
      });
  });
});
