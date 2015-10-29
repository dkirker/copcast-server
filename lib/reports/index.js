var express = require('express'),
  app = module.exports = express(),
  db = require('./../db'),
  auth = require('./../auth'),
  _ = require('lodash'),
  config = require('./../config');

app.post('/report/use/:fromDate/:toDate', auth.ensureToken, function(req,res) {
  var dateRange = [ moment(req.params.fromDate).toDate(), moment(req.params.toDate).hour(23).minute(59).seconds(59).toDate() ];
  var ret = [];
  db.group.findById(req.user.groupId).then(function(group){
    var where = {};
    if (!group.isAdmin){
      where["groupId"] = group.id;
    }
    db.user.findAll({
      attributes: [sequelize.fn('COUNT', 1), "counter"],
      where : mergeHashs(where,{ lastLocationUpdate : { between : dateRange }}),
    }).then(function(users){
      ret["activeOfficers"] = users[0].counter;

    });

    db.video.findAll({
      attributes: [sequelize.fn('COUNT', 1), "counter"],
      where : { createdAt : { between : dateRange }},
      include: [{
        model: db.user,
        where: where
      }]
    }).then(function(videos){
      ret["recordedHours"] = users[0].counter;
    });

    
    var ret222 = {
      activeOfficers: null,
      missions: null,
      recordedHours: '15:24',
      streamedHours: '3:54',
      incidents: 6,
      adminAccess: 5,
      incidentReport: [1,4,2,6,0],
      users: [
      {userName: 'Bruno Siqueira',
        activities: [
          {
            date: '2015-10-07',
            recordingTime: '08:25',
            streamingTime: '00:25',
            total: '18:00',
            pausedTime: '00:10',
            numberMissionStopped: 4
          }
        ]}
    ]
    }

  });

  function mergeHashs(hash1, hash2){
    for (var attrname in hash1) { hash2[attrname] = hash1[attrname]; }
    return hash2
  }
});


