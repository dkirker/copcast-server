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

    var page = req.query.page ? parseInt(req.query.page) : 1;
    var perPage = req.query.perPage ? parseInt(req.query.perPage) : 20
    db.history.findAndCountAll({
        include: [{
          model: db.user,
          include: {
            model: db.group
          }
        }],
        limit: perPage,
        offset: (page - 1) * perPage,
        order: 'date desc',
        where: where

      })

      .then(function (logreports) {
        res.send(logreports);
      }).error(function (err) {
      console.error(err);
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

    var page = req.query.page ? parseInt(req.query.page) : 1;
    var perPage = req.query.perPage ? parseInt(req.query.perPage) : 20

    db.history.findAndCountAll(
      {
        limit: perPage,
        offset: (page - 1) * perPage,
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
        res.send(result);
    }).error(function (err) {
      console.error(err);
      res.sendStatus(500);
    });;
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
