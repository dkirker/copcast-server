var express = require('express'),
  app = module.exports = express(),
  db = require('./../db'),
  auth = require('./../auth'),
  _ = require('lodash'),
  config = require('./../config');

app.get('/report/use/:fromDate/:toDate', auth.ensureAdminLevelTwo, function (req, res) {
  var fromDate = moment(req.params.fromDate).toDate();
  var toDate = moment(req.params.toDate).endOf('day').toDate();
  var dateRange = [fromDate, toDate];
  var ret = {};

  var finished = _.after(8, function () {
    res.send(ret)
  });
  db.group.findById(req.user.groupId).then(function (group) {
    var where = {};
    if (!group.isAdmin) {
      where["groupId"] = group.id;
    }

    getVideosPlayed(dateRange, group, function(videos){
      ret.playedVideos = videos;
      finished();
    });
    getTotalAdminLogIn(dateRange, group, function(total){
      ret.adminAccess = total;
      finished();
    });

    getTotalRecordedMinutes(dateRange, where, function (total) {
      ret.recordedTime = total;
      finished();
    });

    getTotalOfState(fromDate, toDate, group, null, 'STREAMING', function (total) {
      ret.streamedTime = total;
      finished();
    });

    getExportedVideos(fromDate, toDate, group, function (exportList) {
      ret.exportList = exportList;
      finished();
    });

    db.incident.findAll({
      where: {date: {between: dateRange}},
      include: [{
        model: db.user,
        where: where
      }]
    }).then(function (incidents) {
      ret.incidents = incidents.length;
      finished();
    });

    loadUsersData(ret, where, fromDate, toDate, group, function () {
      finished();
    });

    loadIncidentForms(ret, group, fromDate, toDate, function () {
      finished();
    });

    ////TODO incidentReport [1,4,2,6,0]
    //
    //var ret222 = {
    //  activeOfficers: null,
    //  missions: null,
    //  recordedHours: '15:24',
    //  streamedHours: '3:54',
    //  incidents: 6,
    //  adminAccess: 5,
    //  incidentReport: [1,4,2,6,0],
    //  users: [
    //  {userName: 'Bruno Siqueira',
    //    activities: [
    //      {
    //        date: '2015-10-07',
    //        recordingTime: '08:25',
    //        streamingTime: '00:25',
    //        total: '18:00',
    //        pausedTime: '00:10',
    //        numberMissionStopped: 4
    //      }
    //    ]}
    //]
    //}

  });
});

function loadIncidentForms(ret, group, fromDate, toDate, callback) {
  ret.incidentReport = [0, 0, 0, 0, 0];

  var replacements = {fromDate: fromDate, toDate: toDate};
  var query = 'SELECT gravity, COUNT(1) FROM "incidentForms" "form" ' +
    'JOIN users "users" ON "form"."userId" = "users"."id" ' +
    'WHERE "form"."accident" = true AND "form"."date" BETWEEN :fromDate AND :toDate ';

  if (!group.isAdmin) {
    query = query + ' AND "users"."groupId" = :groupId';
    replacements["groupId"] = group.id;
  }
  query = query + 'GROUP BY gravity ';

  db.sequelize.query(query, {
    type: db.sequelize.QueryTypes.SELECT,
    replacements: replacements
  }).then(function (incidents) {
    for (var i = 0; i < incidents.length; i++) {
      var incidentForm = incidents[i];
      ret.incidentReport[incidentForm.gravity - 1] = incidentForm.count;
    }
    callback();
  });
}
function mergeHashs(hash1, hash2) {
  for (var attrname in hash1) {
    hash2[attrname] = hash1[attrname];
  }
  return hash2
}
function getExportedVideos(fromDate, toDate, group, callback){
  var conditions = {where: {createdAt : { between : [fromDate, toDate] }}, include:
    [{model: db.user, as: 'Exporter', attributes: ['id', 'name']},
    {model: db.user, as: 'Recorder', attributes: ['id', 'name']}]}
  if (!group.isAdmin){
    conditions.where["Recorder.'groupId'"] = group.id;
  }
  db.export.findAll(conditions).then(function(exportList){
    callback(exportList)
  }).error(function (err) {
    console.log(err);
    callback(null);
  });
}

function getTotalAdminLogIn(dateRange, group, callback){
  console.log('getTotalRecordedMinutesByUser');
  var replacements = {fromDate: dateRange[0], toDate: dateRange[1], state: 'LOGGED_ADMIN'};
  var query = 'SELECT 1 FROM histories h '+
    ' JOIN users u ON u.id = h."userId" '+
    ' WHERE "nextState" = :state AND date BETWEEN :fromDate AND :toDate ';
  if (!group.isAdmin){
    query = query + ' AND u."groupId" = :groupId ';
    replacements.groupId = group.id;
  }
  query = query + ' GROUP BY u.id ';

  db.sequelize.query(query, {
    replacements: replacements,
    type: db.sequelize.QueryTypes.SELECT
  }).then(function (results) {
    callback(results.length);
  });
}
function getVideosPlayed(dateRange, group, callback){
  console.log('getVideosPlayed');
  var replacements = {fromDate: dateRange[0], toDate: dateRange[1], state: 'PLAYING_VIDEO'};
  var query = 'SELECT h.*, u.name FROM histories h '+
    ' JOIN users u ON u.id = h."userId" '+
    ' WHERE "nextState" = :state AND date BETWEEN :fromDate AND :toDate ';
  if (!group.isAdmin){
    query = query + ' AND u."groupId" = :groupId ';
    replacements.groupId = group.id;
  }

  db.sequelize.query(query, {
    replacements: replacements,
    type: db.sequelize.QueryTypes.SELECT
  }).then(function (results) {
    var array = [];
    for(var i = 0; i < results.length; i++){
      var h = results[i];
      var extras = JSON.parse(h.extras);
      array.push({url: extras.videoName,startTime: extras.startTime ,
        date: h.date,  userName: h.name, userRecorderName: extras.userName});
    }
    callback(array);
  });
}

function getTotalOfState(fromDate, toDate, group, user, state, callback) {
//streamed hours
  var where = {date: {between: [fromDate, toDate]}, $or: [{previousState: state}, {nextState: state}]};

  if (!group.isAdmin) {
    where['"users"."groupId"'] = group.id;
  }
  if (user) {
    where["userId"] = user.id;
  }
  db.history.findAll({where: where, order: ["userId", "date"], include: db.user}).then(function(histories){

    if (histories.length > 0){
      var total = 0, userId = null, date = null;
      for(var i = 0; i < histories.length; i++){
        var history = histories[i]
        if (history.nextState == state && userId == null){
          userId = history.userId;
          date = history.date;
        } else if(history.previousState == state && userId == history.userId){
          total += moment(history.date).diff(moment(date), "minutes");
          date = null;
          userId = null
        } else if(history.nextState == state && userId == history.userId){
          date = history.date
        } else {
          userId = null;
          date = null;
        }
      }
      callback(total);
    } else {
      callback(0);
    }
  });

}
function getTotalRecordedMinutes(dateRange, where, callback) {
  console.log('getTotalRecordedMinutes');
  db.video.findAll({
    attributes: [
      [db.sequelize.fn("sum", db.sequelize.col("duration")), "sum"]
    ],
    where: mergeHashs(where, {date: {between: dateRange}})
  }).then(function (videos) {
    callback(videos[0].dataValues.sum ? Math.ceil(parseInt(videos[0].dataValues.sum) / 60) : 0);
  });
}

function getTotalMissions(fromDate, toDate, user, callback) {
  console.log('getTotalMissions');
  db.sequelize.query('SELECT COUNT(1) FROM "histories" AS "histories" ' +
    'INNER JOIN "users" AS "user" ON "histories"."userId" = "user"."id" WHERE ' +
    '"histories"."date" BETWEEN :fromDate AND :toDate ' +
    'AND "user"."id" = :userId AND "previousState" = :state AND "nextState" <> :streamingState ' +
    'AND "nextState" <> :pausedState', {
    replacements: {userId: user.id, fromDate: fromDate, toDate: toDate, state: 'RECORDING_ONLINE',
      streamingState: 'STREAMING', pausedState: 'PAUSED'},
    type: db.sequelize.QueryTypes.SELECT
  }).then(function (results) {
    callback(results[0].count ? results[0].count : 0);
  });
}

function getDaysWithActivities(fromDate, toDate, userId, callback){
  console.log('getDaysWithActivities');
  db.sequelize.query('SELECT to_char(date, \'YYYY-MM-DD\') AS "date" '+
  'FROM locations ' +
  'WHERE date BETWEEN :fromDate AND :toDate ' +
  'AND "userId" = :userId ' +
  'GROUP BY 1', {
    replacements: {userId: userId, fromDate: fromDate, toDate: toDate},
    type: db.sequelize.QueryTypes.SELECT
  }).then(function(results){
    callback(results);
  }).error(function(err){
    console.error(err);
  });
}

function getTotalVideoInformationByUser(fromDate, toDate, userId, callback) {
  console.log('getTotalRecordedMinutesByUser');
  db.sequelize.query('SELECT SUM("duration") AS "sum", SUM("filesize") as "filesize", to_char("video"."date",\'YYYY-MM-DD\') AS "date"' +
    'FROM "videos" AS "video" ' +
    'INNER JOIN "users" AS "user" ON "video"."userId" = "user"."id" WHERE ' +
    '"video"."date" BETWEEN :fromDate AND :toDate ' +
    'AND "user"."id" = :userId ' +
    'GROUP BY 3', {
    replacements: {userId: userId, fromDate: fromDate, toDate: toDate},
    type: db.sequelize.QueryTypes.SELECT
  }).then(function (results) {
    callback(results.map(function(result){
      return {
        recordedTime: result.sum ? Math.ceil(parseInt(result.sum) / 60) : 0,
        filesize: result.filesize,
        date: result.date
      }
    }));
  }).error(function(err){
    console.error(err);
  });
}
function loadUsersData(ret, where, fromDate, toDate, group, callback) {
  ret.users = [];
  db.user.findAll({
    where: where,
    include: [{
      model: db.location,
      where: {date: {between: [fromDate, toDate]}}
    }]
  }).then(function (users) {
    ret.activeOfficers = users.length;
    var finished = _.after(users.length, function(callback){
      //convert hashes to arrays
      for (var i = 0; i < ret.users.length; i++) {
        var user = ret.users[i];
        var activities = [];
        var keys = Object.keys(user.activities);
          for(var j = 0; j < keys.length; j++){
          activities.push(user.activities[keys[j]]);
        }
        user.activities = activities.sort(function (left, right) {
          return moment(left.date).diff(moment(right.date));
        });
      }
      callback()
    }.bind(null, callback));
    if (users.length === 0) {
      callback();
    }
    for (var i = 0; i < users.length; i++) {
      var user = users[i];
      var userObj = {username: user.username};
      ret.users.push(userObj);
      getDaysWithActivities(fromDate, toDate, user.id, function(userObj, user, days){
        userObj.activities = {};
        for(var i=0; i< days.length; i++){
          userObj.activities[days[i].date] = {date: days[i].date};
        }
        getTotalVideoInformationByUser(fromDate, toDate, user.id,
          function (userObj,user, results) {
            for(var i = 0; i < results.length; i++){
              var result = results[i];
              userObj.activities[result.date] = result;
            }

            results.sort(function (left, right) {
              return moment(left.date).diff(moment(right.date));
            });
            var keys = Object.keys(userObj.activities);
            if ( 0 < keys.length){
              var finishedPartial = _.after(5 * keys.length, finished);
              for(var i = 0 ; i < keys.length ; i++) {
                var initDate = moment(keys[i], 'YYYY-MM-DD');
                var endDate = moment(keys[i], 'YYYY-MM-DD').endOf('day');
                getTotalOfState(initDate.toDate(), endDate.toDate(), group, user, 'STREAMING', function (total) {
                  this.streamedTime = total;
                  finishedPartial();
                }.bind(userObj.activities[keys[i]]));

                getTotalOfState(initDate.toDate(), endDate.toDate(), group, user, 'RECORDING_ONLINE', function (total) {
                  this.estimatedRecordingTime = total;
                  finishedPartial();
                }.bind(userObj.activities[keys[i]]));

                getTotalOfState(initDate.toDate(), endDate.toDate(), group, user, 'PAUSED', function (total) {
                  this.pausedTime = total;
                  //Return lodash
                  finishedPartial();
                }.bind(userObj.activities[keys[i]]));

                getTotalMissions(initDate.toDate(), endDate.toDate(), user,
                  function (total) {
                    this.totalMissions = total;
                    finishedPartial();
                  }.bind(userObj.activities[keys[i]]));

                db.incident.findAll({
                  where: {date: {between: [initDate.toDate(), endDate.toDate()]}, userId: user.id},
                  include: [{
                    model: db.user,
                    where: where
                  }]
                }).then(function (incidents) {
                  this.incidents = incidents.length;
                  finishedPartial();
                }.bind(userObj.activities[keys[i]]));

              }
            } else {
              userObj.activities = [];
              finished();
            }

          }.bind(null, userObj, user));
      }.bind(null, userObj, user));

    }
  });
}



