var express = require('express'),
  app = module.exports = express(),
  db = require('./../db'),
  auth = require('./../auth'),
  _ = require('lodash'),
  config = require('./../config');

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

app.post('/histories', auth.ensureUser, function(req,res) {
  if ( !(req.body instanceof Array) ) {
    var history = db.history.build({
      previousState: req.body.previousState,
      nextState: req.body.nextState,
      extras: req.body.extras,
      date: req.body.date
    });

    history.setUser(req.user, {save:false});
    history.save().then(function () {
      res.sendStatus(200);
    });

  } else {
    var histories = [];
    _.forEach(req.body, function (hist) {
      hist.userId = req.user.id;
      if (!containsElement(histories, hist)) {
        histories.push(hist);
      }
    });

    db.history.bulkCreate(histories)
      .then(function(result) {
        res.sendStatus(200);
      }).error(function(err) {
        console.log(err);
        res.sendStatus(500);
      });
  }
});

app.post('/histories/:user', auth.ensureUser, function (req, res) {
  db.user.find({where: {username: req.params.user}}).then(function(user){
    if (user == null){
      res.sendStatus(404);
    } else {
      if (!(req.body instanceof Array)) {
        var history = db.history.build({
          previousState: req.body.previousState,
          nextState: req.body.nextState,
          extras: req.body.extras,
          date: req.body.date
        });

        history.save().then(function () {
          history.setUser(user);
        });
        res.sendStatus(200);
      } else {
        var histories = [];
        _.forEach(req.body, function (hist) {
          hist.userId = user.id;
          if (!containsElement(histories, hist)) {
            histories.push(hist);
          }
        });
        db.history.bulkCreate(histories)
          .then(function (result) {
            res.sendStatus(200);
          }).error(function (err) {
            console.log(err);
            res.sendStatus(500);
          });
      }
    }
  });
});

