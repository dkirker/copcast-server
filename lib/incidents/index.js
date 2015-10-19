var express = require('express'),
  app = module.exports = express(),
  moment = require('moment'),
  db = require('./../db'),
  _ = require('lodash'),
  auth = require('./../auth'),
  Sequelize = require('sequelize'),
  config = require('./../config'),
  sequelize = new Sequelize(config.db, { dialect : 'postgres', logging: false, omitNull: true/*,logging: console.log*/ });

app.post('/incidents', auth.ensureToken, function(req,res) {
  if ( !(req.body instanceof Array) ) {
    console.log(req.body);
    res.sendStatus(200);
  } else {
    _.forEach(req.body, function(inc) {
      loc.userId = req.user.id;
      console.log(inc);
    });
  }
});

app.post('/incidents/:user', auth.ensureToken, function(req,res) {
  db.user.find({where: {username: req.params.user}}).then(function(user){
    if (user == null){
      res.sendStatus(404);
    } else {
      _.forEach(req.body, function (inc) {
        console.log(inc);
      });
    }
    res.sendStatus(200);
  });
});
