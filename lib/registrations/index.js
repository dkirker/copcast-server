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
  console.log(req.connection.remoteAddress);

  var request = db.registration.parseRequest(req.body),
                password = req.body.password;
  if (request == null || !password || typeof password !== 'string') {
    return res.sendStatus(400); //return bad request
  }

  db.user.find({ where : { username : request.username}}).then(function(user) {
    if (!user) {
      return res.sendStatus(401);
    }

    user.validatePassword(password, function(valid) {
      if (!valid || !auth.hasLevel(user, 'admin_1')) {
        return res.sendStatus(401);
      }

      request.createdAt = Date.now();
      request.ipaddress = req.connection.remoteAddress;

      db.registration.upsert(request).then(function(out){
        return res.sendStatus(201);
      }).catch(function(err) {
        console.log(err);
        return res.sendStatus(500);
      });
    });
    return null;
  });
});
