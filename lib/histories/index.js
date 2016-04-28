var express = require('express'),
  app = module.exports = express(),
  db = require('./../db'),
  auth = require('./../auth'),
  _ = require('lodash'),
  config = require('./../config'),
  signing = require('./../signing');

function containsElement(array, el){
  var found = false;
  for(var i = 0; i < array.length; i++) {
    if (array[i].date === el.date &&
      array[i].previousState === el.previousState &&
      array[i].nextState === el.nextState) {
      found = true;
      break;
    }
  }
  return found;
}

app.post('/histories', auth.ensureUser, signing.verify, function(req,res) {

  var history = db.history.build({
    previousState: req.body.previousState,
    nextState: req.body.nextState,
    extras: JSON.stringify(req.body.extras),
    date: req.body.date
  });

  history.setUser(req.user, {save:false});

  history.save().then(function () {
    return res.sendStatus(201);
  }).catch(function(err){
    console.error(err);
    return res.sendStatus(500);
  });
});

app.post('/histories/:user', auth.ensureUser, signing.verify, function (req, res) {
  db.user.find({where: {username: req.params.user}}).then(function(user){

    if (user == null)
      return res.sendStatus(404);

    var histories = [];
    _.forEach(req.body.bulk, function (hist) {
      hist.userId = user.id;
      if (!containsElement(histories, hist)) {
        histories.push(hist);
      }
    });

    db.history.bulkCreate(histories)
      .then(function (result) {
        return res.sendStatus(201);
      }).error(function (err) {
        console.log(err);
        return res.sendStatus(500);
      });
  });
});

