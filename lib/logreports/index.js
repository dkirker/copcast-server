/**
 * Created by alex on 11/24/15.
 */
var express = require('express'),
  app = module.exports = express(),
  db = require('./../db'),
  auth = require('./../auth'),
  config = require('./../config'),
  moment = require('moment');

const { Op } = require('sequelize');

// list all histories log
app.get('/logreports/:initialDate/:finalDate', auth.ensureAdminLevelOne, function(req,res) {
  if(!moment(req.params.initialDate).isValid() || !moment(req.params.finalDate).isValid()) {
    return res.sendStatus(400);
  }
  if(moment(req.params.initialDate).isAfter(moment(req.params.finalDate).toDate())){
    return res.sendStatus(400);
  }

  req.user.getGroup().then(function (group) {
    var dateRange = [moment(req.params.initialDate).hour(0).minute(0).seconds(1).toDate(), moment(req.params.finalDate).hour(23).minute(59).seconds(59).toDate()];

    var where = {date: {[Op.between]: dateRange}};
    var include = {
      model: db.user,
      include: {
        model: db.group
      }
    };

    if (!group.isAdmin && !req.query.group) {
      include.include.where = {id: group.id};
    } else if (req.query.group){
      include.include.where = {id: req.query.group};
    }

    if (req.query.user){
      include.where = {id: req.query.user};
    }

    var page = req.query.page ? parseInt(req.query.page) : 1;
    var perPage = req.query.perPage ? parseInt(req.query.perPage) : 20
    db.history.findAndCountAll({
        include: [include],
        limit: perPage,
        offset: (page - 1) * perPage,
        order: [['date', 'desc']],
        where: where

      })

      .then(function (logreports) {
        res.send(logreports);
      }).catch(function (err) {
      console.error(err);
      res.sendStatus(500);
    });
  });
});


//list the logreports
app.get('/logreports', auth.ensureAdminLevelOne, function (req, res) {
  db.group.findByPk(req.user.groupId).then(function (group) {
    var where = {};
    if (!group.isAdmin) {
      where["groupId"] = group.id;
    }

    var page = req.query.page ? parseInt(req.query.page) : 1;
    var perPage = req.query.perPage ? parseInt(req.query.perPage) : 20;
    var include = {
      model: db.user,
      include: {
        model: db.group
      }
    };

    if (!group.isAdmin && !req.query.group) {
      include.include.where = {id: group.id};
    } else if (req.query.group){
      include.include.where = {id: req.query.group};
    }

    if (req.query.user){
      include.where = {id: req.query.user};
    }

    db.history.findAndCountAll({
      limit: perPage,
      offset: (page - 1) * perPage,
      where: where,
      order: [['date', 'desc']],
      include: [include]
    }).then(function (result) {
      res.send(result);
    }).catch(function (err) {
      console.error(err);
      res.sendStatus(500);
    });
  });
});
