var express = require('express'),
    app = module.exports = express(),
    db = require('./../db'),
    auth = require('./../auth')
    Sequelize = require('sequelize'),
    moment = require('moment');

app.delete('/groups/:id', auth.ensureAdminLevelOne, function(req, res) {
  db.group.findById(req.user.groupId).then(function(groupCurrent) {
    if (groupCurrent != null && groupCurrent.isAdmin === true) {

      db.group.findById(req.params.id).then(function (group) {
        if (group.id != groupCurrent.id ) {
          group.countUsers().then(function(countUsers){
            if (countUsers == 0) {
              group.destroy();
              res.sendStatus(200);
            } else {
              res.status(403).send("Has associated users");
            }
          });
        } else {
          res.status(403).send( "Cannot delete your own group");
        }
      }).catch(function (err) {
        res.status(422).send( err);
      });

    } else {
      res.sendStatus(403);
    }
  });
});

app.get('/groups', auth.ensureAdminLevelOne, function(req, res) {
    db.group.findById(req.user.groupId).then(function(group){
        if (group != null && group.isAdmin === true ){
            db.group.findAll({ order : 'name ASC'}).then(function(groups){
                res.send(groups);
            });
        } else {
            res.send([group]);
        }
    });
});

app.get('/groups-paginated', auth.ensureAdminLevelOne, function(req, res) {
  db.group.findById(req.user.groupId).then(function(group){
    if (group != null && group.isAdmin === true ){
      var page = req.query.page ? parseInt(req.query.page) : 1;
      var perPage = req.query.perPage ? parseInt(req.query.perPage) : 20;

      db.group.findAndCountAll({
        order : 'name ASC',
        limit: perPage,
        offset: (page - 1) * perPage
      }).then(function(groups){
        res.send(groups);
      });
    } else {
      res.send([group]);
    }
  });
});

app.get('/groups/isadmin', auth.ensureAdminLevelOne, function(req, res) {
  db.group.findById(req.user.groupId).then(function(group){
    if (group != null && group.isAdmin === true ){
      res.send(true);
    } else {
      res.send(false);
    }
  });
});

app.get('/groups/:id', auth.ensureAdminLevelOne, function(req, res) {
  db.group.findById(req.user.groupId).then(function(group){
    if (group.id == req.params.id) {
      res.send(group);
    }else if (group != null && group.isAdmin === true ){
      db.group.findById(req.params.id).then(function(group){
        res.send(group);
      });
    } else {
      res.sendStatus(403);
    }
  });
});



app.post('/groups/:id', auth.ensureAdminLevelOne, function(req, res) {
  db.group.findById(req.user.groupId).then(function(group){
    if (group != null && group.isAdmin === true ){

      db.group.findById(req.params.id).then(function(group){
        group.updateAttributes(req.body).then(function(){
          res.send(group);
        }).catch(function(err) {
          res.status(422).send( err);
        });
      });

    } else {
      res.sendStatus(403);
    }
  });
});

app.post('/groups', auth.ensureAdminLevelOne, function(req, res) {
  db.group.findById(req.user.groupId).then(function(group){
    if (group != null && group.isAdmin === true ){
      db.group
        .build({
          name: req.body.name,
          lat: req.body.lat,
          lng: req.body.lng,
          isAdmin: req.body.isAdmin
        })
        .save()
        .then(function(group) {
          res.status(200).send( { id : group.id });
        }).catch(function(err) {
          res.status(500).send( err);
        });
    } else {
      res.sendStatus(403);
    }
  });
});

function getLocationsByGroup(groupId, initialDate, finalDate, res) {
  db.sequelize.query(  'SELECT "location"."id", "location"."date", "location"."lat", "location"."lng", "location"."accuracy", "user"."id" '+
  'AS "userId" FROM "locations" AS "location" '+
  'LEFT OUTER JOIN "users_active" AS "user" '+
  'ON "location"."userId" = "user"."id" '+
  // 'WHERE "location"."id" IN (SELECT MAX("loc"."id") '+
  'WHERE "location"."id" IN (SELECT "loc"."id" '+
  'FROM "locations" AS "loc" '+
  'JOIN "users_active" AS "u" ON "u"."id" = "loc"."userId" '+
  'WHERE (("u"."groupId" = ?) AND ("loc"."date" '+
  'BETWEEN ? AND ?)) '+
  // 'GROUP BY date_trunc(\'year\', "loc"."date"), date_trunc(\'month\', "loc"."date"), date_trunc(\'day\', "loc"."date") '+
  // ',date_trunc(\'hour\', "loc"."date"), date_trunc(\'minute\', "loc"."date") '+
  // ', date_trunc(\'second\', "loc"."date") '+
  ') ORDER BY "userId", "location"."date" ASC ',
    { type: db.sequelize.QueryTypes.SELECT,
      model: db.location,
      replacements: [groupId, initialDate, finalDate]})
    .then(function (locations) {
    var response = {}, auxId = null;
    for (var i = 0; i < locations.length; i++) {
      var location = locations[i];
      if (auxId == null || auxId != location.userId) {
        auxId = location.userId;
        response[auxId] = [];
      }
      response[auxId].push(location);
    }
    res.send(response);
  }).catch(function (err) {
    console.log(err);
    res.sendStatus(500);
  });
}

app.get('/groups/:id/locations/:date', auth.ensureAdminLevelOne, function(req, res){
  getLocationsByGroup(req.params.id, moment(req.params.date).toDate(),
    moment(req.params.date).hour(23).minute(59).seconds(59).toDate(), res);
});

app.get('/groups/:id/locations/:initialDate/:finalDate', auth.ensureAdminLevelOne, function(req, res){
  getLocationsByGroup(req.params.id, moment(req.params.initialDate).hour(0).minute(0).seconds(1).toDate(),
    moment(req.params.finalDate).hour(23).minute(59).seconds(59).toDate(), res);
});

app.get('/groups/:id/videos/from/:date', auth.ensureAdminLevelOne, function (req, res) {
  if(!moment(req.params.date).isValid()) {
    console.log('Invalid date. ['+req.params.date+']');
    return res.sendStatus(400);
  }
  var dateRange = [ moment(req.params.date).toDate(), moment(req.params.date).hour(23).minute(59).seconds(59).toDate() ];

  db.video.findAll({
    where : { date : { between : dateRange }},
    order: [['date', 'asc']],
    raw : true,
    include: [{
      model: db.user,
      where: {
        groupId: req.params.id
      },
      required: true
    }]
  })

    .then(function(videos) {
      var result = [];
      videos.forEach(function(video) {
        result.push({
          id : video.id,
          from : moment(video.date).toISOString(),
          to : moment(video.date).add('seconds', video.duration).toISOString(),
          userId: video.userId
        });
      });

      res.send(result);
    });
});

app.get('/groups/:id/videos/from/:initialDate/:finalDate', auth.ensureAdminLevelOne, function (req, res) {
  if(!moment(req.params.initialDate).isValid() || !moment(req.params.finalDate).isValid()) {
    console.log('Invalid dates. initial=['+req.params.initialDate+'] and final=['+req.params.finalDate+']');
    return res.sendStatus(400);
  }
  if(moment(req.params.initialDate).isAfter(moment(req.params.finalDate).toDate())){
    console.log('Invalid range. initial=['+req.params.initialDate+'] and final=['+req.params.finalDate+']');
    return res.sendStatus(400);
  }
//  var dateRange = [ moment(req.params.initialDate).toDate(), moment(req.params.finalDate).toDate() ];
  var dateRange = [ moment(req.params.initialDate).hour(0).minute(0).seconds(1).toDate(), moment(req.params.finalDate).hour(23).minute(59).seconds(59).toDate() ];


  db.video.findAll({
    where : { date : { between : dateRange }},
    order: [['date', 'asc']],
    raw : true,
    include: [{
      model: db.user,
      where: {
        groupId: req.params.id
      },
      required: true
    }]
  })

    .then(function(videos) {
      var result = [];
      videos.forEach(function(video) {
        result.push({
          id : video.id,
          from : moment(video.date).toISOString(),
          to : moment(video.date).add('seconds', video.duration).toISOString(),
          userId: video.userId,
          isDeleted: video.isDeleted,
          isValid: video.isValid
        });
      });

      res.send(result);
    });
});



