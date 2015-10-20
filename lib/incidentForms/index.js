/**
 * Created by brunosiqueira on 13/10/15.
 */
var express = require('express'),
  app = module.exports = express(),
  db = require('./../db'),
  auth = require('./../auth'),
  config = require('./../config');

app.post("/incidentForms", auth.ensureAdmin, function (req, res) {

  var incidentForm = db.incidentForm.build(req.body);
  incidentForm.userId = req.user.id


  history.save().then(function () {
    res.sendStatus(200);
  });


});
