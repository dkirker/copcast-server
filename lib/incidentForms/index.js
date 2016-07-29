/**
 * Created by brunosiqueira on 13/10/15.
 */
var express = require('express'),
  app = module.exports = express(),
  db = require('./../db'),
  _ = require('lodash'),
  auth = require('./../auth'),
  signing = require('./../signing'),
  config = require('./../config');

var body2Incident = function(b, userId) {
  // build incidentForm object, leaving other fields in the body
  var obj = {};

  keys = [
    'date',
    'address',
    'lat',
    'lng',
    'accident',
    'gravity',
    'injured',
    'fine',
    'fineType',
    'arrest',
    'resistance',
    'argument',
    'useOfForce',
    'useLethalForce'
  ];

  keys.forEach(function(k) {
    obj[k] = b[k];
  });

  obj.userId = userId;

  return obj;
};

app.post("/incidentForms", auth.ensureUser, signing.verify, function (req, res) {
  var obj = body2Incident(req.body, req.user.id);
  var incidentFormObj = db.incidentForm.build(obj);

  incidentFormObj.save().then(function () {
    return res.sendStatus(201);
  }).catch(function (err) {
    console.error(err);
    return res.sendStatus(500);
  });
});

app.post("/incidentForms/:user", auth.ensureUser, signing.verify, function (req, res) {
  if (!('bulk' in req.body)) {
    console.log("Missing bulk data in incidentsForms for user: "+req.params.user);
    return res.sendStatus(500);
  }

  db.user.find({where: {username: req.params.user}}).then(function(user) {
    var incidentForms = [];

    if (user == null)
      return res.sendStatus(404);

    _.forEach(req.body.bulk, function(inc) {
      var obj = body2Incident(inc, user.id);
      incidentForms.push(obj);
    });

    db.incidentForm.bulkCreate(incidentForms)
    .then(function () {
      return res.sendStatus(201);
    }).catch(function (err) {
      console.log(err);
      return res.sendStatus(500);
    });
  });
});

app.post('/incidentForms/:user', auth.ensureUser, function (req, res) {
  db.user.find({where: {username: req.params.user}}).then(function(user){
    if (user == null){
      res.sendStatus(404);
    } else {
      _.forEach(req.body, function (inc) {
        inc.userId = user.id;
      });

      db.incidentForm.bulkCreate(req.body)
      .then(function (result) {
        res.sendStatus(200);
      }).catch(function (err) {
        console.log(err);
        res.sendStatus(500);
      });
    }
  });
});

app.post('/incidentForms/:user', auth.ensureUser, function (req, res) {
  db.user.find({where: {username: req.params.user}}).then(function(user){
    if (user == null){
      res.sendStatus(404);
    } else {
      _.forEach(req.body, function (inc) {
        inc.userId = user.id;
      });

      db.incidentForm.bulkCreate(req.body)
      .then(function (result) {
        res.sendStatus(200);
      }).catch(function (err) {
        console.log(err);
        res.sendStatus(500);
      });
    }
  });
});


//list the incidentForms
app.get('/incidentForms', auth.ensureAdminLevelTwo, function (req, res) {
  var page = req.query.page ? parseInt(req.query.page) : 1;
  var perPage = req.query.perPage ? parseInt(req.query.perPage) : 20;

  var where = {};
  var include = {
    model: db.user,
    include: {
      model: db.group
    }
  };

  if (req.query.user){
    include.where = {id: req.query.user};
  }

  if (req.query.group) {
    include.include.where = {id: req.query.group};
  }

  db.incidentForm.findAndCountAll({
    limit: perPage,
    offset: (page - 1) * perPage,
    where: where,
    order: 'date desc',
    include: [include]
    // include: [{
    //   model: db.user,
    //   include:{
    //     model: db.group
    //     where: {
    //       'isAdmin': true,
    //       'id':req.user.groupId
    //     }
    //   }
    // }]
  }).then(function(result){
    res.send(result);
  });
});


app.get('/incidentForm/:id', auth.ensureAdminLevelTwo, function (req, res) {
  db.incidentForm.findById(req.params.id, {
    include: [db.user]
  }).then(function(result){
    console.log("findById =" + result);
    res.send(result);
  }).catch(function(err) {
    console.log("Error IncidentForm: " + err);
    res.status(500).send( err);
  });
});


app.get('/incidentForms/:initialDate/:finalDate', auth.ensureAdminLevelTwo, function(req,res) {
  var page = req.query.page ? parseInt(req.query.page) : 1;
  var perPage = req.query.perPage ? parseInt(req.query.perPage) : 20;

  if(!moment(req.params.initialDate).isValid() || !moment(req.params.finalDate).isValid()) {
    console.log('Invalid dates. initial=['+req.params.initialDate+'] and final=['+req.params.finalDate+']');
    return res.sendStatus(400);
  }

  if(moment(req.params.initialDate).isAfter(moment(req.params.finalDate).toDate())){
    console.log('Invalid range. initial=['+req.params.initialDate+'] and final=['+req.params.finalDate+']');
    return res.sendStatus(400);
  }

  var dateRange = [ moment(req.params.initialDate).hour(0).minute(0).seconds(1).toDate(), moment(req.params.finalDate).hour(23).minute(59).seconds(59).toDate() ];

  var where = {};
  var include = {
    model: db.user,
    include: {
      model: db.group
    }
  };

  where.date = { between : dateRange };

  if (req.query.user){
    include.where = {id: req.query.user};
  }

  if (req.query.group) {
    include.include.where = {id: req.query.group};
  }

  // console.log("dataRange=", dateRange);
  // console.log("req.params.id=", req.params.id);

  db.incidentForm.findAndCountAll({
    limit: perPage,
    offset: (page - 1) * perPage,
    // where: Sequelize.and({date : { between : dateRange }}),
    where: where,
    order: 'date desc',
    include: [include]
    // include: [{
    //   model: db.user,
    //   include:{
    //     model: db.group,
    //     where: {
    //       'isAdmin': true,
    //       'id':req.user.groupId
    //     }
    //   }
    // }]
  }).then(function(incidentForms) {
    // console.log("send200 = ", incidentForms);
    res.send(incidentForms);
  }).catch(function(err) {
    console.log(err);
    return res.sendStatus(500);
  });
});
