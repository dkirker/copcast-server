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



app.get('/users/:id/incidents/:date', auth.ensureAdmin, function(req,res) {
  var dateRange = [ moment(req.params.date).toDate(), moment(req.params.date).hour(23).minute(59).seconds(59).toDate() ];

  db.incident.findAll({
    where : { date : { between : dateRange }, userId : req.params.id },
    order: [['date', 'asc']],
    attributes : ['lat','lng','date'],
    raw : true
  })

    .then(function(incidents) {

      res.send(incidents);
    }).error(function(err) {
      console.log(err);
      res.sendStatus(500);
    });
});

app.get('/users/:id/incidents/:initialDate/:finalDate', auth.ensureAdmin, function(req,res) {
  if(!moment(req.params.initialDate).isValid() || !moment(req.params.finalDate).isValid()) {
    console.log('Invalid dates. initial=['+req.params.initialDate+'] and final=['+req.params.finalDate+']');
    return res.sendStatus(400);
  }
  if(moment(req.params.initialDate).isAfter(moment(req.params.finalDate).toDate())){
    console.log('Invalid range. initial=['+req.params.initialDate+'] and final=['+req.params.finalDate+']');
    return res.sendStatus(400);
  }

  var dateRange = [ moment(req.params.initialDate).hour(0).minute(0).seconds(1).toDate(), moment(req.params.finalDate).hour(23).minute(59).seconds(59).toDate() ];

  db.incident.findAll({
    where:
      Sequelize.and({date : { between : dateRange }},
        Sequelize.and({userId : req.params.id}))
    ,
    order: [['date', 'asc']],
    attributes : ['lat','lng','date'],
    raw : true
  })

    .then(function(incidents) {
      res.send(incidents);
    }).error(function(err) {
      console.log(err);
      res.sendStatus(500);
    });
});

app.get('/groups/:id/incidents/:date', auth.ensureAdmin, function(req, res){
  getIncidentsByGroup(req.params.id, moment(req.params.date).toDate(),
    moment(req.params.date).hour(23).minute(59).seconds(59).toDate(), res);
});


app.get('/groups/:id/incidents/:initialDate/:finalDate', auth.ensureAdmin, function(req, res){
  getIncidentsByGroup(req.params.id, moment(req.params.initialDate).hour(0).minute(0).seconds(1).toDate(),
    moment(req.params.finalDate).hour(23).minute(59).seconds(59).toDate(), res);
});

function getIncidentsByGroup(groupId, initialDate, finalDate, res) {
  db.sequelize.query(  'SELECT "incident"."id", "incident"."date", "incident"."lat", "incident"."lng", "user"."id" '+
    'AS "userId" FROM "incidents" AS "incident" '+
    'LEFT OUTER JOIN "users" AS "user" '+
    'ON "incident"."userId" = "user"."id" '+
    'WHERE (("user"."groupId" = ?) AND ("incident"."date" '+
    'BETWEEN ? AND ?)) '+
    ' ORDER BY "userId", "incident"."date" ASC ',
    { type: db.sequelize.QueryTypes.SELECT,
      model: db.incident,
      replacements: [groupId, initialDate, finalDate]})
    .then(function (incidents) {
      var response = {}, auxId = null;
      for (var i = 0; i < incidents.length; i++) {
        var incident = incidents[i];
        if (auxId == null || auxId != incident.userId) {
          auxId = incident.userId;
          response[auxId] = [];
        }
        response[auxId].push(incident);
      }
      res.send(response);
    }).error(function (err) {
      console.log(err);
      res.sendStatus(500);
    });
}
