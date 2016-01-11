/**
 * Created by alex on 11/24/15.
 */
var express = require('express'),
  app = module.exports = express(),
  db = require('./../db'),
  auth = require('./../auth'),
  config = require('./../config');


// list all histories log
app.get('/logreports/:initialDate/:finalDate', auth.ensureAdminLevelOne, function(req,res) {

  console.log("req=", req);

  if(!moment(req.params.initialDate).isValid() || !moment(req.params.finalDate).isValid()) {
    console.log('Invalid dates. initial=['+req.params.initialDate+'] and final=['+req.params.finalDate+']');
    return res.sendStatus(400);
  }
  if(moment(req.params.initialDate).isAfter(moment(req.params.finalDate).toDate())){
    console.log('Invalid range. initial=['+req.params.initialDate+'] and final=['+req.params.finalDate+']');
    return res.sendStatus(400);
  }
  db.group.findById(req.user.groupId).then(function (group) {
    var dateRange = [moment(req.params.initialDate).hour(0).minute(0).seconds(1).toDate(), moment(req.params.finalDate).hour(23).minute(59).seconds(59).toDate()];

    var where = {date: {between: dateRange}};
    if (!group.isAdmin) {
      where["group.id"] = group.id;
    }


    db.history.findAll({
        include: [{
          model: db.user,
          include: {
            model: db.group
          }
        }],
        order: 'date desc',
        where: where

      })

      .then(function (logreports) {
        console.log("send200 = ", logreports);
        res.send(logreports);
      }).error(function (err) {
      console.log(err);
      res.sendStatus(500);
    });
  });
});


//list the logreports
app.get('/logreports', auth.ensureAdminLevelOne, function (req, res) {

  db.group.findById(req.user.groupId).then(function (group) {
    var where = {};
    if (!group.isAdmin) {
      where["groupId"] = group.id;
    }
    db.history.findAll(
      {
        limit: 20,
        where: where,
        order: 'date desc',
        include: [{
          model: db.user,
          include: {
            model: db.group
          }
          ,
          raw: true
        }]
      }).then(function (result) {
        console.log(".history.findAll=", result);
        res.send(result);

    });
  });
});


app.get('/logreports/:id', auth.ensureAdminLevelOne, function (req, res) {
  db.group.findById(req.user.groupId).then(function (group) {
    db.history.findById(
      req.params.id,
      {include: [db.user]}
    ).then(function (result) {
      console.log("History find =" + result);
      if (!group.isAdmin && group.id != result.user.groupId){
        res.sendStatus(403)
      } else {
        res.send(result);
      }

    }).error(function (err) {
      console.log("Error logreports: " + err);
      res.status(500).send(err);
    });

  });
});
