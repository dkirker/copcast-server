var express = require('express'),
  app = module.exports = express(),
  db = require('./../db'),
  auth = require('./../auth'),
  _ = require('lodash'),
  config = require('./../config');

app.get('/report/use/:fromDate/:toDate', auth.ensureAdminLevelTwo, function (req, res) {
  var fromDate = moment(req.params.fromDate).toDate();
  var toDate = moment(req.params.toDate).hour(23).minute(59).seconds(59).toDate();
  var dateRange = [fromDate, toDate];
  var ret = {};

  var finished = _.after(7, function () {
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
  var replacements = {initialDate: fromDate, finalDate: toDate, state: state};
  var queryHistory = 'SELECT "hist"."nextState", "hist"."date" "initialDate", "histNext"."previousState", "histNext"."date" "endDate" ' +
    'FROM histories "hist" ' +
    'JOIN histories "histNext" ON ' +
    '	"hist"."userId" = "histNext"."userId" ' +
    '	AND	"hist"."nextState" = "histNext"."previousState" ' +
    'JOIN users "users" ON "users"."id" = "hist"."userId" ' +
    'WHERE "histNext"."id" IN (SELECT "histIn"."id" ' +
    '				FROM histories "histIn" ' +
    '				WHERE "histIn"."date" > "hist"."date" ' +
    '					AND "histIn"."previousState" = "hist"."nextState" ' +
    '					AND "histIn"."userId" = "hist"."userId" ' +
    '				ORDER BY "histIn"."date" ASC ' +
    '				LIMIT 1 ' +
    '				) ' +
    '	AND "hist"."nextState" = :state ';
  if (!group.isAdmin) {
    queryHistory = queryHistory + ' AND "users"."groupId" = :groupId';
    replacements["groupId"] = group.id;
  }
  if (user) {
    queryHistory = queryHistory + ' AND "users"."id" = :userId';
    replacements["userId"] = user.id;
  }
  queryHistory = queryHistory + '	AND "hist"."date" > :initialDate AND "hist"."date" < :finalDate ' +
    'ORDER BY "hist"."date"';

  db.sequelize.query(queryHistory, {
    type: db.sequelize.QueryTypes.SELECT,
    replacements: replacements
  }).then(function (histories) {
    var total = 0;
    for (var i = 0; i < histories.length; i++) {
      var history = histories[i];
      var minutes = moment(history.endDate).diff(moment(history.initialDate), "minutes");
      total = total + minutes;
    }
    callback(total);
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

function getTotalRecordedMinutesByUser(fromDate, toDate, userId, callback) {
  console.log('getTotalRecordedMinutesByUser');
  db.sequelize.query('SELECT SUM("duration") AS "sum" ' +
    'FROM "videos" AS "video" ' +
    'INNER JOIN "users" AS "user" ON "video"."userId" = "user"."id" WHERE ' +
    '"video"."date" BETWEEN :fromDate AND :toDate ' +
    'AND "user"."id" = :userId', {
    replacements: {userId: userId, fromDate: fromDate, toDate: toDate},
    type: db.sequelize.QueryTypes.SELECT
  }).then(function (results) {
    callback(results[0].sum ? Math.ceil(parseInt(results[0].sum) / 60) : 0);
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
    var finished = _.after(users.length * 3 * (moment(toDate.toString()).diff(moment(fromDate.toString()), "days") + 1), callback);
    if (users.length === 0) {
      callback();
    }
    for (var i = 0; i < users.length; i++) {
      var user = users[i];
      var userObj = {username: user.username};
      ret.users.push(userObj);
      for (var m = moment(fromDate.toString()); (m.isBefore(toDate, 'days') || m.isSame(toDate, 'days')); m.add('days', 1)) {

        userObj.activities = [];

        getTotalRecordedMinutesByUser(m.toDate(), moment(m.toString()).hour(23).minute(59).seconds(59).toDate(), user.id,
          function (date, userObj,user, total) {
            var m = moment(date);
            var activityObj = {date: m};
            if (total) {
              activityObj.recordedTime = total;
              userObj.activities.push(activityObj);
              getTotalOfState(m.toDate(), moment(m.toString()).hour(23).minute(59).seconds(59).toDate(), group, user, 'STREAMING', function (total) {
                this.streamedTime = total;
                finished();
              }.bind(activityObj));

              getTotalOfState(m.toDate(), moment(m.toString()).hour(23).minute(59).seconds(59).toDate(), group, user, 'PAUSED', function (total) {
                this.pausedTime = total;
                //Return lodash
                finished();
              }.bind(activityObj));

              getTotalMissions(m.toDate(), moment(m.toString()).hour(23).minute(59).seconds(59).toDate(), user,
                function (total) {
                  this.totalMissions = total;
                  finished();
                }.bind(activityObj));
            } else {
              finished();
              finished();
              finished();
            }
          }.bind(null, m.toString(), userObj, user));

      }
    }
  });
}



