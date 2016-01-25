var express = require('express'),
  app = module.exports = express(),
  moment = require('moment'),
  db = require('./../db'),
  _ = require('lodash'),
  auth = require('./../auth'),
  Sequelize = require('sequelize'),
  config = require('./../config'),
  sequelize = new Sequelize(config.db, { dialect : 'postgres', logging: false, omitNull: true/*,logging: console.log*/ });

app.post('/registration', function(req,res) {
  console.log(req.body);

  var reg = db.registration.build({imei: req.body.imei, simid: req.body.simid, public_key: req.body.public_key});
  reg.save().then(function(out, err){
    console.log(out);
    console.log(err);
  });

  return res.send({teste: 1});
});
