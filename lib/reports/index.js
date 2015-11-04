var express = require('express'),
  app = module.exports = express(),
  db = require('./../db'),
  auth = require('./../auth'),
  _ = require('lodash'),
  config = require('./../config');

app.get('/report/use/:fromDate/:toDate', auth.ensureAdmin, function (req, res) {
  var fromDate = moment(req.params.fromDate).toDate();
  var toDate = moment(req.params.toDate).hour(23).minute(59).seconds(59).toDate();
  var dateRange = [fromDate, toDate];
  var ret = {};

  var finished = _.after(4, function () {
    res.send(ret)
  });
  db.group.findById(req.user.groupId).then(function (group) {
    var where = {};
    if (!group.isAdmin) {
      where["groupId"] = group.id;
    }

    getTotalRecordedHours(dateRange, where, function (total) {
      ret.recordedHours = total;
      finished();
    });

    getTotalOfState(fromDate, toDate, group, null, 'STREAMING', function (total) {
      ret.streamedHours = total;
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

function mergeHashs(hash1, hash2) {
  for (var attrname in hash1) {
    hash2[attrname] = hash1[attrname];
  }
  return hash2
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
  queryHistory = queryHistory + '	AND "hist"."date" > :initialDate AND "hist"."date" > :finalDate ' +
    'ORDER BY "hist"."date"';

  db.sequelize.query(queryHistory, {
    type: db.sequelize.QueryTypes.SELECT,
    replacements: replacements
  }).then(function (histories) {
    var total = 0;
    for (var history in histories) {
      var minutes = moment(history.endDate).diff(moment(history.initialDate), "minutes");
      total = total + minutes;
    }
    callback(total);
  });
}
function getTotalRecordedHours(dateRange, where, callback) {
  console.log('getTotalRecordedHours');
  db.video.find({
    attributes: [
      [db.sequelize.fn("sum", db.sequelize.col("duration")), "sum"]
    ],
    where: mergeHashs(where, {date: {between: dateRange}})
  }).then(function (video) {
    callback(video.dataValues.sum);
  });
}

function getTotalRecordedHoursByUser(fromDate, toDate, userId, callback) {
  console.log('getTotalRecordedHoursByUser');
  db.sequelize.query('SELECT SUM("duration") AS "sum" ' +
    'FROM "videos" AS "video" ' +
    'INNER JOIN "users" AS "user" ON "video"."userId" = "user"."id" WHERE ' +
    '"video"."date" BETWEEN :fromDate AND :toDate ' +
    'AND "user"."id" = :userId', {
    replacements: {userId: userId, fromDate: fromDate, toDate: toDate},
    type: db.sequelize.QueryTypes.SELECT
  }).then(function (results) {
    callback(results[0].sum);
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
    var finished = _.after(users.length * 2 * (moment(toDate).diff(moment(fromDate), "days") + 1), callback);
    if (users.length === 0) {
      callback();
    }
    for (var i = 0; i < users.length; i++) {
      var user = users[i];
      var userObj = {username: user.username};
      ret.users.push(userObj);
      for (var m = moment(fromDate); (m.isBefore(toDate, 'days') || m.isSame(toDate, 'days')); m.add('days', 1)) {

        userObj.activities = [];

        getTotalRecordedHoursByUser(m.toDate(), moment(m.toString()).hour(23).minute(59).seconds(59).toDate(), user.id,
          function (m, userObj, total) {
            var activityObj = {date: m};
            if (total) {
              activityObj.recordedHours = total;
              userObj.activities.push(activityObj);
              getTotalOfState(m.toDate(), m.hour(23).minute(59).seconds(59).toDate(), group, user, 'STREAMING', function (total) {
                this.streamedHours = total;
                finished();
              }.bind(activityObj));

              getTotalOfState(m.toDate(), m.hour(23).minute(59).seconds(59).toDate(), group, user, 'PAUSED', function (total) {
                this.pausedTime = total;
                //Return lodash
                finished();
              }.bind(activityObj));
            } else {
              finished();
              finished();
            }
          }.bind(null, m, userObj));
      }
    }
  });
}



