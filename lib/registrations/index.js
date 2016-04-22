var express = require('express'),
  app = module.exports = express(),
  moment = require('moment'),
  db = require('./../db'),
  _ = require('lodash'),
  auth = require('./../auth'),
  Sequelize = require('sequelize'),
  config = require('./../config'),
  sequelize = new Sequelize(config.db, { dialect : 'postgres', logging: false, omitNull: true/*,logging: console.log*/ });

var hasLevel = function(user, level){
  var roles = user.getAvailablePermissions();
  return roles.indexOf(level) > -1;
};

app.post('/registration', function(req,res) {
  console.log(req.connection.remoteAddress);

  if (req.body.imei == null || req.body.simid == null ) {
    return res.sendStatus(400); //return bad request
  }

  db.user.find({ where : { username : req.body.username}}).then(function(user) {
    if (!user) {
      return res.sendStatus(401);
    }
    user.validatePassword(req.body.password, function(valid) {
      if (!valid || !hasLevel(user, 'admin_2')) {
        return res.sendStatus(401);
      }

      db.registration.upsert({
        imei: req.body.imei,
        simid: req.body.simid,
        public_key: req.body.public_key,
        ipaddress: req.connection.remoteAddress,
        username: req.body.username,
        createdAt: Date.now()
      }).then(function(out){
        return res.sendStatus(201);
      }).catch(function(err) {
        console.log(err);
        return res.sendStatus(500);
      });
    });
    return null;
  });
});

app.delete('/registration/:imei', function(req,res) {
  console.log(req.body);

  db.registration.findById(req.params.imei).then(function (reg){
    reg.destroy({ force: true }).then(function(err){
      console.log('deleted:'+err);
      return res.sendStatus(201);
    }).catch(function(err) {
      console.log(err);
      return res.sendStatus(404);
    });
  });
});
