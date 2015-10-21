/**
 * Created by brunosiqueira on 13/10/15.
 */
var express = require('express'),
  app = module.exports = express(),
  db = require('./../db'),
  auth = require('./../auth'),
  config = require('./../config');

app.post("/incidentForms", auth.ensureUser, function (req, res) {

  var incidentForm = db.incidentForm.build(req.body);
  incidentForm.userId = req.user.id


  incidentForm.save().then(function () {
    res.sendStatus(200);
  }).catch(function(error) {
    res.status(406).send(error);
  });


});
