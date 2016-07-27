var express = require('express'),
  app = module.exports = express(),
  moment = require('moment'),
  db = require('./../db'),
  _ = require('lodash'),
  auth = require('./../auth'),
  Sequelize = require('sequelize'),
  config = require('./../config'),
  signing = require('./../signing'),
  sequelize = new Sequelize(config.db, {dialect: 'postgres', logging: false, omitNull: true/*,logging: console.log*/});


app.post('/locations/:user', auth.ensureUser, signing.verify, function (req, res) {

  if (!('bulk' in req.body)) {
    console.log("Missing bulk data in location for user: "+req.params.user);
    return res.sendStatus(500);
  }

  db.user.find({where: {username: req.params.user}}).then(function(user){
    if (user == null)
      return res.sendStatus(404);

    _.forEach(req.body.bulk, function (loc) {
      loc.userId = user.id;
    });

    db.location.bulkCreate(req.body.bulk)
      .then(function () {
        return res.sendStatus(201);
      }).catch(function (err) {
        console.log(err);
        return res.sendStatus(500);
      });
  });
});

app.get('/users/:id/locations/:date', auth.ensureAdminLevelOne, function(req,res) {
  var dateRange = [moment(req.params.date).toDate(), moment(req.params.date).hour(23).minute(59).seconds(59).toDate()];

  db.location.findAll({
    where : { date : { between : dateRange }, userId : req.params.id },
    order: [['date', 'asc']],
    attributes : ['lat','lng','date'],
    raw : true
  })

    .then(function (locations) {
      var locationJson = JSON.stringify(locations);

      return res.send(locationJson);
    }).catch(function (err) {
      console.log(err);
      return res.sendStatus(500);
    });
});

app.get('/users/:id/locations/:initialDate/:finalDate', auth.ensureAdminLevelOne, function(req,res) {
  if(!moment(req.params.initialDate).isValid() || !moment(req.params.finalDate).isValid()) {
    console.log('Invalid dates. initial=['+req.params.initialDate+'] and final=['+req.params.finalDate+']');
    return res.sendStatus(400);
  }
  if(moment(req.params.initialDate).isAfter(moment(req.params.finalDate).toDate())){
    console.log('Invalid range. initial=['+req.params.initialDate+'] and final=['+req.params.finalDate+']');
    return res.sendStatus(400);
  }

  //var dateRange = [ moment(req.params.initialDate).toDate(), moment(req.params.finalDate).toDate() ];
  var dateRange = [ moment(req.params.initialDate).hour(0).minute(0).seconds(1).toDate(), moment(req.params.finalDate).hour(23).minute(59).seconds(59).toDate() ];


  db.location.findAll({
    where: Sequelize.and({date : { between : dateRange }},
                         {userId : req.params.id}),
    order: [['date', 'asc']],
    attributes : ['lat','lng','date', 'accuracy'],
    raw : true
  })

    .then(function(locations) {
      var locationJson = JSON.stringify(locations);

      return res.send(locationJson);
    }).catch(function(err) {
      console.log(err);
      return res.sendStatus(500);
    });
});

app.get('/users/:id/locations/:date', auth.ensureAdminLevelOne, function(req,res) {
  var dateRange = [moment(req.params.date).toDate(), moment(req.params.date).hour(23).minute(59).seconds(59).toDate()];

  db.location.findAll({
    where: Sequelize.and({date: {between: dateRange}},
                         {userId: req.params.id}),
    attributes: ['lat', 'lng', 'date', 'accuracy'],
    order: [['date', 'asc']],
    raw: true
  })
    .then(function (locations) {
      var locationJson = JSON.stringify(locations);

      return res.send(locationJson);
    }).catch(function (err) {
      console.log(err);
      return res.sendStatus(500);
    });
});

app.get('/users/:id/dates/enabled', auth.ensureAdminLevelOne, function(req,res) {
  var where = ['"userId"= ?'],
    params = [],
    select = ['SELECT CAST(CAST(date AS DATE) as VARCHAR(32)) ENABLED_DATES FROM locations'];
  params.push(req.params.id);
  var query = select.join(' ') + ((where.length > 0) ? ' WHERE ' + where.join(' AND ') : '') + ' GROUP BY CAST(CAST(date AS DATE) as VARCHAR(32)) ORDER BY CAST(CAST(date AS DATE) as VARCHAR(32)) ASC';
  db.sequelize.query(query, {
    logging: console.log,
    raw: true,
    replacements: params,
    type: db.sequelize.QueryTypes.SELECT
  }).then(function (result) {
    return res.send(result);
  }).catch(function (err) {
    console.log(err);
    return res.sendStatus(500);
  });
});
