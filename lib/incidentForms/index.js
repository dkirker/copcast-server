/**
 * Created by brunosiqueira on 13/10/15.
 */
var express = require('express'),
  app = module.exports = express(),
  db = require('./../db'),
  auth = require('./../auth'),
  config = require('./../config');

app.post("/incidentForms", auth.ensureUser, function (req, res) {

  console.log("req.body: " + req.body);
  console.log("req.body>req.user.id: " + req.user.id);

  var incidentForm = db.incidentForm.build(req.body);

  incidentForm.userId = req.user.id


  incidentForm.save().then(function () {
    res.sendStatus(200);
  }).catch(function(error) {
    console.error(error);
    res.status(406).send(error);
  });

});



app.get('/incidentForms', auth.ensureAdmin, function (req, res) {

  db.incidentForm.findAll().then(function(result)
  {
    console.log("findAll = " + result);
    res.send(result);

  });

});


app.get('/incidentForm/:id', auth.ensureAdmin, function (req, res) {

  db.incidentForm.findById(req.params.id).then(function(result)
  {
    console.log("findById = " + result);
    res.send(result);

  }).error(function(err) {
    console.log("Error IncidentForm: " + err);
    res.status(500).send( err);
  });;

});
