/**
 * Created by brunosiqueira on 13/10/15.
 */
var express = require('express'),
  app = module.exports = express(),
  db = require('./../db'),
  _ = require('lodash'),
  auth = require('./../auth'),
  config = require('./../config');

app.post("/incidentForms", auth.ensureUser, function (req, res) {


  var storeIncidentForm = function (entry) {
    var incidentFormObj = db.incidentForms.build(entry);

    incidentFormObj.userId = req.user.id;

    incidentFormObj.save();
  }

  if ( !(req.body instanceof Array) ) {
    try {
      storeIncidentForm(req.body);

      //emit message to browser
      /*
      app.get('sockets').emit('users:incidentFlag',
        { id : req.user.id, name: req.user.name, username: req.user.username,
        location: {lat: req.body.lat, lng: req.body.lon}});
      */

      res.sendStatus(200);
    } catch(err) {
      console.log(err);
      res.sendStatus(500);
    }
  } else {
    try {
      _.forEach(req.body, function(inc) {
        storeIncidentForm(inc);
      });
      res.sendStatus(200);
    } catch(err) {
      console.log(err);
      res.sendStatus(500);
    }
  }

  console.log("req.body: " , req.body);
  console.log("req.body>req.user.id: " + req.user.id);
/*
  var incidentForm = db.incidentForms.build(req.body);

  incidentForm.userId = req.user.id


  incidentForm.save().then(function () {
    res.sendStatus(200);
  }).catch(function(error) {
    console.error(error);
    res.status(406).send(error);
  });

 date: entry.date,
 address: entry.address,
 lat: entry.lat,
 lng: entry.lng,
 accident: entry.accident,
 gravity: entry.gravity,
 injured: entry.injured,
 fine: entry.fine,
 fineType: entry.fineType,
 arrest: entry.arrest,
 resistance: entry.resistance,
 argument: entry.argument,
 useOfForce: entry.useOfForce,
 useLethalForce: entry.useLethalForce,
 userId: req.user.id
*/


});



app.get('/incidentForms', auth.ensureAdmin, function (req, res) {

  db.incidentForms.findAll(
    {include: [db.user]}
  ).then(function(result)
  {
    console.log("findAll =" + result);
    res.send(result);

  });

});


app.get('/incidentForm/:id', auth.ensureAdmin, function (req, res) {

  db.incidentForms.findById(
    req.params.id,
    {include: [db.user]}
  ).then(function(result)
  {
    console.log("findById =" + result);
    res.send(result);

  }).error(function(err) {
    console.log("Error IncidentForm: " + err);
    res.status(500).send( err);
  });;

});
