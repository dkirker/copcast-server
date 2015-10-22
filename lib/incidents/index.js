var express = require('express'),
  app = module.exports = express(),
  moment = require('moment'),
  db = require('./../db'),
  _ = require('lodash'),
  auth = require('./../auth'),
  Sequelize = require('sequelize'),
  config = require('./../config'),
  sequelize = new Sequelize(config.db, { dialect : 'postgres', logging: false, omitNull: true/*,logging: console.log*/ });

app.post('/incidents', auth.ensureUser, function(req,res) {

  var storeIncidentFlag = function (date) {
    var incidentObj = db.incident.build({
      date: date,
      userId: req.user.id
    });

    incidentObj.save();
  }


  if ( !(req.body instanceof Array) ) {
    try {
      storeIncidentFlag(req.body.date);
      res.sendStatus(200);
    } catch(err) {
      console.log(err);
      res.sendStatus(500);
    }
  } else {
    try {
      _.forEach(req.body, function(inc) {
        storeIncidentFlag(inc.date);
      });
      res.sendStatus(200);
    } catch(err) {
      console.log(err);
      res.sendStatus(500);
    }
  }
});
