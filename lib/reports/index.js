var express = require('express'),
  app = module.exports = express(),
  db = require('./../db'),
  auth = require('./../auth'),
  _ = require('lodash'),
  config = require('./../config'),
  moment = require('moment');

app.get('/report/use/:fromDate/:toDate', auth.ensureAdminLevelTwo, function (req, res) {
  var fromDate = moment(req.params.fromDate).toDate();
  var toDate = moment(req.params.toDate).endOf('day').toDate();
  var selectedUserId = req.query.userId;
  var selectedGroupId = req.query.groupId;
  var dateRange = [fromDate, toDate];
  var ret = {};

  var finished = _.after(6, function () {
    res.send(ret)
  });
  db.group.findById(req.user.groupId).then(function (myGroup) {

    getVideosPlayed(dateRange, myGroup, selectedGroupId, selectedUserId, function (videos) {
      ret.playedVideos = videos;
      finished();
    });
    getTotalAdminLogIn(dateRange, myGroup, selectedGroupId, selectedUserId, function (total) {
      ret.adminAccess = total;
      finished();
    });

    getExportedVideos(fromDate, toDate, myGroup, selectedGroupId, selectedUserId, function (exportList) {
      ret.exportList = exportList;
      finished();
    });

    var where = {};
    if (!myGroup.isAdmin) {
      where["groupId"] = myGroup.id;
    } else if (selectedGroupId) {
      where["groupId"] = selectedGroupId;
    }

    if (selectedUserId) {
      where["id"] = selectedUserId;
    }

    var includeUser = {
      model: db.user,
      where: where
    };
    db.incident.findAll({

      where: {date: {between: dateRange}},
      include: [includeUser]
    }).then(function (incidents) {
      ret.incidents = incidents.length;
      finished();
    });

    loadUsersData(ret, fromDate, toDate, myGroup, selectedGroupId, selectedUserId, function () {
      finished();
    });

    loadIncidentForms(ret, fromDate, toDate, myGroup, selectedGroupId, selectedUserId, function () {
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

function loadIncidentForms(ret, fromDate, toDate, myGroup, filterGroupId, filterUserId, callback) {
  ret.incidentReport = [0, 0, 0, 0, 0];

  var replacements = {fromDate: fromDate, toDate: toDate};
  var query = 'SELECT gravity, COUNT(1) FROM "incidentForms" "form" ' +
    'JOIN users_active "users" ON "form"."userId" = "users"."id" ' +
    'WHERE "form"."accident" = true AND "form"."date" BETWEEN :fromDate AND :toDate ';

  if (!myGroup.isAdmin) {
    query = query + ' AND "users"."groupId" = :groupId';
    replacements["groupId"] = myGroup.id;
  } else if (filterGroupId) {
    query = query + ' AND "users"."groupId" = :groupId';
    replacements["groupId"] = filterGroupId;
  }

  if (filterUserId) {
    query = query + ' AND "users"."id" = :userId ';
    replacements["userId"] = filterUserId;
  }
  query = query + ' GROUP BY gravity ';

  db.sequelize.query(query, {
    type: db.sequelize.QueryTypes.SELECT,
    replacements: replacements
  }).then(function (incidents) {
    for (var i = 0; i < incidents.length; i++) {
      var incidentForm = incidents[i];
      ret.incidentReport[incidentForm.gravity - 1] = incidentForm.count;
    }
    callback();
  }).catch(function (err) {
    console.error(err);
  });
}

function getExportedVideos(fromDate, toDate, group, filterGroupId, filterUserId, callback) {
  var exporterQuery = {model: db.user, as: 'Exporter', attributes: ['id', 'name', 'groupId']};
  var recorderQuery = {model: db.user, as: 'Recorder', attributes: ['id', 'name', 'groupId']};
  if (filterUserId) {
    exporterQuery.where = {"id": filterUserId};
  }
  if (!group.isAdmin) {
    exporterQuery.where = {"groupId": group.id};
  } else if (filterGroupId) {
    exporterQuery.where = {"groupId": filterGroupId};
  }
  db.export.findAll({
    where: {createdAt: {between: [fromDate, toDate]}}, include: [recorderQuery,
      exporterQuery]
  }).then(function (exportList) {
    callback(exportList)
  }).catch(function (err) {
    console.log(err);
    callback(null);
  });
}

function getTotalAdminLogIn(dateRange, myGroup, filterGroupId, filterUserId, callback) {
  var replacements = {fromDate: dateRange[0], toDate: dateRange[1], state: 'LOGGED_ADMIN'};
  var query = 'SELECT 1 FROM histories h '+
    ' JOIN users_active u ON u.id = h."userId" '+
    ' WHERE "nextState" = :state AND date BETWEEN :fromDate AND :toDate ';
  if (!myGroup.isAdmin) {
    query = query + ' AND u."groupId" = :groupId ';
    replacements.groupId = myGroup.id;
  } else if (filterGroupId) {
    query = query + ' AND u."groupId" = :groupId ';
    replacements.groupId = filterGroupId;
  }
  if (filterUserId) {
    query = query + ' AND u."id" = :userId ';
    replacements.userId = filterUserId;
  }
  query = query + ' GROUP BY u.id ';

  db.sequelize.query(query, {
    replacements: replacements,
    type: db.sequelize.QueryTypes.SELECT
  }).then(function (results) {
    callback(results.length);
  }).catch(function (err) {
    console.error(err);
  });
}
function getVideosPlayed(dateRange, group, filterGroupId, filterUserId, callback) {
  var replacements = {fromDate: dateRange[0], toDate: dateRange[1], state: 'PLAYING_VIDEO'};
  var query = 'SELECT h.*, u.name FROM histories h '+
    ' JOIN users_active u ON u.id = h."userId" '+
    ' WHERE "nextState" = :state AND date BETWEEN :fromDate AND :toDate ';
  if (!group.isAdmin) {
    query = query + ' AND u."groupId" = :groupId ';
    replacements.groupId = group.id;
  } else if (filterGroupId) {
    query = query + ' AND u."groupId" = :groupId ';
    replacements.groupId = filterGroupId;
  }

  if (filterUserId) {
    query = query + ' AND u."id" = :userId ';
    replacements.userId = filterUserId;
  }

  db.sequelize.query(query, {
    replacements: replacements,
    type: db.sequelize.QueryTypes.SELECT
  }).then(function (results) {
    var array = [];
    for (var i = 0; i < results.length; i++) {
      var h = results[i];
      var extras = JSON.parse(h.extras);
      array.push({
        url: extras.videoName, startTime: extras.startTime,
        date: h.date, userName: h.name, userRecorderName: extras.userName
      });
    }
    callback(array);
  }).catch(function (err) {
    console.error(err);
  });
}



function getTotalOfState(fromDate, toDate, myGroup, filterGroupId, filterUserId, state, callback) {
  var userIncluded = {model: db.user, where: {}}
  if (!myGroup.isAdmin) {
    userIncluded.where.groupId = myGroup.id;
  } else if (filterGroupId) {
    userIncluded.where.groupId = filterGroupId;
  }
  if (filterUserId) {
    userIncluded.where.id = filterUserId;
  }
  db.history.findAll({
    where: {date: {between: [fromDate, toDate]}, $or: [{previousState: state}, {nextState: state}]},
    order: ["userId", "date"], include: userIncluded
  }).then(function (histories) {

    if (histories.length > 0) {
      var total = 0, userId = null, date = null;
      for (var i = 0; i < histories.length; i++) {
        var history = histories[i]
        if (history.nextState == state && (userId == null || userId != history.userId)) {
          userId = history.userId;
          date = history.date;
        } else if (history.previousState == state && userId == history.userId) {
          total += moment(history.date).diff(moment(date), "seconds");
          date = null;
          userId = null
        } else if (history.nextState == state && userId == history.userId) {
          date = history.date
        } else {
          userId = null;
          date = null;
        }
      }
      total = total / 60;
      if (total > 1){
        total = Math.ceil(total);
      } else if (total != 0){
        total = 1;
      }
      callback(total);
    } else {
      callback(0);
    }
  }).catch(function (err) {
    console.error(err);
  });

}

function getTotalMissions(fromDate, toDate, userId, callback) {
  db.sequelize.query('SELECT COUNT(1) FROM "histories" AS "histories" ' +
    'INNER JOIN "users_active" AS "user" ON "histories"."userId" = "user"."id" WHERE ' +
    '"histories"."date" BETWEEN :fromDate AND :toDate ' +
    'AND "user"."id" = :userId AND "previousState" = :state AND "nextState" <> :streamingState ' +
    'AND "nextState" <> :pausedState', {
    replacements: {
      userId: userId, fromDate: fromDate, toDate: toDate, state: 'RECORDING',
      streamingState: 'STREAMING', pausedState: 'PAUSED'
    },
    type: db.sequelize.QueryTypes.SELECT
  }).then(function (results) {
    callback(results[0].count ? parseInt(results[0].count) : 0);
  }).catch(function (err) {
    console.error(err);
  });
}

function getDaysWithActivities(fromDate, toDate, userId, callback) {
  db.sequelize.query('SELECT to_char(date, \'YYYY-MM-DD\') AS "date" ' +
    'FROM locations ' +
    'WHERE date BETWEEN :fromDate AND :toDate ' +
    'AND "userId" = :userId ' +
    'GROUP BY 1', {
    replacements: {userId: userId, fromDate: fromDate, toDate: toDate},
    type: db.sequelize.QueryTypes.SELECT
  }).then(function (results) {
    callback(results);
  }).catch(function (err) {
    console.error(err);
  });
}

/**
 * Return the total of uploaded videos in KB.
 * @param fromDate
 * @param toDate
 * @param userId
 * @param callback
 */
function getDataUploaded(fromDate, toDate, userId, callback) {
  db.sequelize.query('SELECT SUM("filesize") as "filesize"' +
    'FROM "videos" AS "video" ' +
    'INNER JOIN "users_active" AS "user" ON "video"."userId" = "user"."id" WHERE ' +
    '"video"."date" BETWEEN :fromDate AND :toDate ' +
    'AND "user"."id" = :userId', {
    replacements: {userId: userId, fromDate: fromDate, toDate: toDate},
    type: db.sequelize.QueryTypes.SELECT
  }).then(function (results) {
    callback(results.length > 0 ? results[0].filesize /1024 : 0);
  }).catch(function (err) {
    console.error(err);
  });
}

function getRemainingData(fromDate, toDate, userId, callback){
  db.sequelize.query('SELECT extras FROM histories '+
    'WHERE extras like :data '+
    'AND date BETWEEN :fromDate AND :toDate ' +
    'AND "userId" = :userId ' +
    'ORDER BY date DESC '+
    'LIMIT 1 ', {
    replacements: {
      userId: userId, fromDate: fromDate, toDate: toDate, data: '%"data":%'
    },
    type: db.sequelize.QueryTypes.SELECT
  }).then(function (results) {
    callback(results[0] ? JSON.parse(results[0].extras).data : null);
  }).catch(function (err) {
    console.error(err);
  });
}

function loadUsersData(ret, fromDate, toDate, myGroup, filterGroupId, filterUserId, callback) {
  ret.users = [];
  ret.streamedTime = 0;
  ret.recordedTime = 0;
  ret.missions = 0;
  var where = {};
  if (!myGroup.isAdmin) {
    where["groupId"] = myGroup.id;
  } else if (filterGroupId) {
    where["groupId"] = filterGroupId;
  }
  if (filterUserId) {
    where["id"] = filterUserId;
  }
  db.user.findAll({
    where: where,
    include: [{
      model: db.location,
      where: {date: {between: [fromDate, toDate]}}
    }]
  }).then(function (users) {
    ret.activeOfficers = users.length;
    if (users.length === 0) {
      return callback();
    }
    var finished = _.after(users.length, callback);
    for (var i = 0; i < users.length; i++) {
      var user = users[i];
      var userObj = {username: user.username, name: user.name};
      ret.users.push(userObj);
      getDaysWithActivities(fromDate, toDate, user.id, function (userObj, user, days) {
        userObj.activities = [];
        var finishedPartial = _.after(7 * days.length, function () {
          finished();
        });
        for (var i = 0; i < days.length; i++) {
          var activity = {date: days[i].date};
          userObj.activities.push(activity);

          var initDate = moment(days[i].date, 'YYYY-MM-DD');
          var endDate = moment(days[i].date, 'YYYY-MM-DD').endOf('day');
          getTotalOfState(initDate.toDate(), endDate.toDate(), myGroup, null, user.id, 'STREAMING', function (total) {
            this.streamedTime = total;
            ret.streamedTime += total;
            finishedPartial();
          }.bind(activity));

          getTotalOfState(initDate.toDate(), endDate.toDate(), myGroup, null, user.id, 'RECORDING', function (total) {
            this.recordingTime = total;
            ret.recordedTime += total;
            finishedPartial();
          }.bind(activity));

          getTotalOfState(initDate.toDate(), endDate.toDate(), myGroup, null, user.id, 'PAUSED', function (total) {
            this.pausedTime = total;
            //Return lodash
            finishedPartial();
          }.bind(activity));

          getDataUploaded(initDate.toDate(), endDate.toDate(), user.id, function (size) {
            this.filesize = size;
            finishedPartial();
          }.bind(activity));

          getTotalMissions(initDate.toDate(), endDate.toDate(), user.id, function (total) {
            this.totalMissions = total;
            ret.missions += total;
            finishedPartial();
          }.bind(activity));

          getRemainingData(initDate.toDate(), endDate.toDate(), user.id, function (total) {
            this.remainingData = total;
            finishedPartial();
          }.bind(activity));

          db.incident.findAll({
            where: {date: {between: [initDate.toDate(), endDate.toDate()]}},
            include: [{
              model: db.user, where: {id: user.id}
            }]
          }).then(function (incidents) {
            this.incidents = incidents.length;
            finishedPartial();
          }.bind(activity));
        }
        userObj.activities = userObj.activities.sort(function (left, right) {
          return moment(left.date).diff(moment(right.date));
        });
      }.bind(null, userObj, user));

    }
  });
}



