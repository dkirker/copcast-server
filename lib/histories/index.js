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
  var parsed = db.history.parseRequest(req.body),
               history;
  if (!parsed) {
    return res.sendStatus(400);
  }

  history = db.history.build(parsed);
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

    if (!('bulk' in req.body) || !Array.isArray(req.body.bulk)) {
      console.log("Missing bulk data in histories for user: "+req.params.user);
      return res.sendStatus(400);
    }

    var histories = [], row;
    if ( !req.body.bulk.some(function (hist) {
      row = db.history.parseRequest(hist, {userId: user.id});

      if (!row) {
        return false;
      }

      if (!containsElement(histories, row)) {
        histories.push(row);
      }

      return true;
    })) {
      return res.sendStatus(400);
    }

    db.history.bulkCreate(histories)
      .then(function (result) {
        return res.sendStatus(201);
      }).catch(function (err) {
        console.log(err);
        return res.sendStatus(500);
      });
  });
});

