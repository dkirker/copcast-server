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
    var incidentFormObj = db.incidentForm.build(entry);

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


});


//list the incidentForms
app.get('/incidentForms', auth.ensureAdminLevelTwo, function (req, res) {

  db.incidentForm.findAll(
    {
      limit:20,
      include: [{
        model: db.user,
        include:{
           model: db.group,
          where: {
            'isAdmin': true,
            'id':req.user.groupId
          }
        }
        ,
        raw : true
      }]
  }).then(function(result)
  {
    console.log("findAll=" + result);
    res.send(result);

  });

});


app.get('/incidentForm/:id', auth.ensureAdminLevelTwo, function (req, res) {

  db.incidentForm.findById(
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


app.get('/incidentForms/:initialDate/:finalDate', auth.ensureAdminLevelTwo, function(req,res) {

  console.log("req=", req);

  if(!moment(req.params.initialDate).isValid() || !moment(req.params.finalDate).isValid()) {
    console.log('Invalid dates. initial=['+req.params.initialDate+'] and final=['+req.params.finalDate+']');
    return res.sendStatus(400);
  }
  if(moment(req.params.initialDate).isAfter(moment(req.params.finalDate).toDate())){
    console.log('Invalid range. initial=['+req.params.initialDate+'] and final=['+req.params.finalDate+']');
    return res.sendStatus(400);
  }

  var dateRange = [ moment(req.params.initialDate).hour(0).minute(0).seconds(1).toDate(), moment(req.params.finalDate).hour(23).minute(59).seconds(59).toDate() ];

  console.log("dataRange=", dateRange);
  console.log("req.params.id=", req.params.id);

  db.incidentForm.findAll({
    include: [{
      model: db.user,
      include:{
        model: db.group,
        where: {
          'isAdmin': true,
          'id':req.user.groupId
        }
      }
    }],
    where:
      Sequelize.and({date : { between : dateRange }} )

  })

    .then(function(incidentForms) {
      console.log("send200 = ", incidentForms);
      res.send(incidentForms);
    }).error(function(err) {
      console.log(err);
      res.sendStatus(500);
    });
});
