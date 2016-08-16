var express = require('express'),
  app = module.exports = express(),
  moment = require('moment'),
  db = require('./../db'),
  auth = require('./../auth'),
  emailManager = require('./../utils/email_manager'),
  config = require('./../config'),
  path = require('path'),
  fs = require('fs'),
  Busboy = require('busboy'),
  mkdirp = require('mkdirp'),
  rimraf = require('rimraf'),
  storage = require('./../videos/storage'),
  slice = require('stream-slice').slice;


rmDir = function (dirPath, callback) {
  try {
    var files = fs.readdirSync(dirPath);
  }
  catch (err) {
    return callback();
  }
  if (!files) {
    return callback();
  }
  if (files.length > 0)
    for (var i = 0; i < files.length; i++) {
      var filePath = dirPath + '/' + files[i];
      if (fs.statSync(filePath).isFile())
        fs.unlinkSync(filePath);
      else
        rmDir(filePath, callback);
    }
  fs.rmdirSync(dirPath);
  callback();
};


app.get('/users/me', auth.ensureUser, function (req, res) {
  db.group.findById(req.user.groupId).then(function (group) {
    res.json({
      id: req.user.id,
      username: req.user.username,
      lastLocationUpdateDate: req.user.lastLocationUpdateDate,
      lastPos: req.user.lastLat != null && req.user.lastLng ? {lat: req.user.lastLat, lng: req.user.lastLng} : {},
      group: group != null ? {
        name: group.name,
        lat: group.lat,
        lng: group.lng,
        id: group.id,
        isGroupAdmin: group.isAdmin
      } : {},
      language: req.user.language
    });
  });
  return null;
});

app.get('/users/adminRoles', auth.ensureAdminLevelOne, function (req, res) {
  res.send(req.user.getAvailableAdminRoles());
});

app.get('/users/roles', auth.ensureAdminLevelOne, function (req, res) {
  res.send(req.user.getAvailableRoles());
});

app.get('/users/online', auth.ensureAdminLevelOne, function (req, res) {
  var date = moment().subtract(5, 'minute'), where;
  db.group.findById(req.user.groupId).then(function (group) {
    if (group == null || group.isAdmin === true) {
      where = {lastLat: {ne: null}, lastLocationUpdateDate: {gte: date.toDate()}};
    } else {
      where = {lastLat: {ne: null}, lastLocationUpdateDate: {gte: date.toDate()}, groupId: req.user.groupId};
    }
    db.user.findAll({
        where: where,
        attributes: ['id', 'name', 'lastLat', 'lastLng', 'groupId', 'profilePicture', 'username']
      })
      .then(function (users) {
        res.send(users.map(function (user) {
          return {
            id: user.id,
            name: user.name,
            location: {
              lat: user.lastLat,
              lng: user.lastLng
            },
            username: user.username,
            group: user.getGroup() != null ? user.getGroup().name : null,
            groupId: user.groupId
          }
        }));
      }).catch(function (err) {
      console.log(err);
      res.sendStatus(500);
    });
    return null;
  });
  return null;
});

app.get('/users/streaming', auth.ensureAdminLevelOne, function (req, res) {
  db.group.findById(req.user.groupId).then(function (group) {
    if (group == null || group.isAdmin === true) {
      res.send(app.get('streams').getStreams().map(function (user) {
        return {
          id: user.userId
        }
      }));
    } else {
      res.send(app.get('streams').getStreamsByGroup(req.user.groupId).map(function (user) {
        return {
          id: user.userId
        }
      }));
    }
  });
});

app.get('/users', auth.ensureAdminLevelOne, function (req, res) {
  db.group.findById(req.user.groupId).then(function (group) {
    var where = [],
      params = [],
      select = ['SELECT DISTINCT U.id, U.username, U.\"lastLocationUpdateDate\", U.name, U.\"profilePicture\", G.name as group, G.lat, G.lng, U.\"isEnabled\", U.\"createdAt\" FROM "users_active" U LEFT OUTER JOIN "groups_active" G ON U."groupId" = G.id'];

    if (req.query.user) {
      req.query.user = '%' + req.query.user + '%';
      where.push('(U.username LIKE ? OR U.name LIKE ?)');
      params.push('%' + req.query.user + '%');
      params.push('%' + req.query.user + '%');
    }

    if (group == null || group.isAdmin === true) {
      if (req.query.group) {
        where.push('G.name LIKE ?');
        params.push('%' + req.query.group + '%');
      }
    } else {
      where.push('G.id = ?');
      params.push(group.id);
    }

    var query = select.join(' ') + ((where.length > 0) ? ' WHERE ' + where.join(' AND ') : '') + ' ORDER BY U.name';

    db.sequelize.query(query, {
      logging: console.log,
      raw: true,
      replacements: params,
      type: db.sequelize.QueryTypes.SELECT
    }).then(function (result) {
      res.send(result);
      return null;
    });
  });
});

app.get('/users-paginated', auth.ensureAdminLevelOne, function (req, res) {
  db.group.findById(req.user.groupId).then(function (group) {
    var where = {};
    if (!group.isAdmin) {
      where["groupId"] = group.id;
    }

    var page = req.query.page ? parseInt(req.query.page) : 1;
    var perPage = req.query.perPage ? parseInt(req.query.perPage) : 20;

    var include = {
      model: db.group
    };

    if (!group.isAdmin && !req.query.group) {
      include.where = {id: group.id};
    } else if (req.query.group){
      include.where = {id: req.query.group};
    }

    if (req.query.filter) {
      console.log(req.query.filter);
      where["$or"] = [{
        username: {
          $iLike: '%' + req.query.filter + '%'
        }
      }, {
        name: {
          $iLike: '%' + req.query.filter + '%'
        }
      }, {
        email: {
          $iLike: '%' + req.query.filter + '%'
        }
      }];
    }

    db.user.findAndCountAll({
      where: where,
      order: 'name asc',
      limit: perPage,
      offset: (page - 1) * perPage,
      include: [include]
    }).then(function (result) {
      // console.log(result);
      res.send(result);
    }).catch(function (err) {
      console.error(err);
      res.sendStatus(500);
    });
  });
});

app.post('/users', auth.ensureAdminLevelOne, function (req, res) {
  var user = db.user.build({
    username: req.body.username,
    email: req.body.email,
    name: req.body.name,
    role: req.body.role,
    groupId: req.body.groupId,
    isAdmin: req.body.isAdmin,
    language: req.body.language
  });

  if (req.user.canModifyThisUser(user)) {
    user.hashPassword(req.body.password, function () {
      user.save().then(function () {
        res.sendStatus(202);
      }).catch(function (err) {
        res.status(422).send(err);
      });
    });
  } else {
    res.status(403).send("Can not create user with this role");
  }
});


app.post('/users/:id', auth.ensureAdminLevelOne, function (req, res) {
  if (req.user.canModifyThisUser(req.body)) {
    db.group.findById(req.user.groupId).then(function (group) {
      db.user.findById(req.params.id).then(function (user) {
        console.log("users_post" + user.id + " : " + user.name);

        if ((group != null && group.isAdmin !== true && group.id != user.groupId) ||
          (!req.user.canModifyThisUser(user))) {
          res.status(403).send("You do not have permission to modify this user");
        } else {
          if(!req.body.isAdmin){
            req.body.role = 'mobile';
          }

          user.updateAttributes(req.body).then(function () {
            res.send(user);
          }).catch(function (err) {
            res.status(422).send(err);
          });
        }
      }).catch(function (err) {
        res.status(500).send(err);
      });
    });
  } else {
    res.status(403).send("Can not update user with this role");
  }
});

app.post('/users/:id/change-password', auth.ensureAdminLevelOne, function (req, res) {
  db.group.findById(req.user.groupId).then(function (group) {
    db.user.findById(req.params.id).then(function (user) {
      if ((group != null && group.isAdmin !== true && group.id != user.groupId) ||
        (!req.user.canModifyThisUser(user))) {
        res.status(403).send("You do not have permission to modify this user");
      } else {
        user.validatePassword(req.body.password.oldPassword, function (valid) {
          if (!valid) {
            res.status(403).send('Invalid password');
          } else {
            user.hashPassword(req.body.password.newPassword, function () {
              user.save().then(function () {
                res.sendStatus(200);
              }).catch(function (err) {
                res.status(422).send(err);
              });
            });
          }
        });
      }
    }).catch(function (err) {
      res.status(500).send(err);
    });
  });
});

app.get('/users/:id', auth.ensureAdminLevelOne, function (req, res) {
  db.group.findById(req.user.groupId).then(function (group) {
    db.user.findById(req.params.id).then(function (user) {
      if (group != null && group.isAdmin !== true && group.id != user.groupId) {
        res.sendStatus(403);
      } else {
        res.send({user: user, isSelf: req.user.id == user.id});
      }
    }).catch(function (err) {
      res.status(500).send(err);
    });
  });
});

app.get('/users/confirmResetToken/:token', function (req, res) {
    db.user.find({where: {rememberToken: req.params.token}}).then(function (user) {
      if (user) {
        res.sendStatus(200);
      } else {
        res.status(403).send('Could not find user with token.');
      }
    }).catch(function (err) {
      res.status(500).send(err);
    });
});

app.post('/users/changePasswordToken/:token', function (req, res) {
    db.user.find({where: {rememberToken: req.params.token}}).then(function (user) {
      if (user) {
        user.hashPassword(req.body.password, function () {
          user.rememberToken = '';
          user.save().then(function () {
            res.sendStatus(200);
          }).catch(function (err) {
            res.status(422).send(err);
          });
        });
      } else {
        res.status(403).send('Could not find user with token.');
      }
    }).catch(function (err) {
      res.status(500).send(err);
    });
});

app.delete('/users/:id', auth.ensureAdminLevelOne, function (req, res) {
  db.user.findById(req.params.id).then(function (user) {
    if (!user) {
      return res.status(404).send('User does not exist');
    } else if (!req.user.canModifyThisUser(user)) {
      res.status(403).send("You do not have permission to modify this user");
    } else {
      user.destroy();  //destroy user
      res.sendStatus(200);
    }
  }).catch(function (err) {
    res.status(500).send(err);
  });
});


app.post('/users/:email/reset_password', function (req, res) {
  db.user.findOne({where: {email: req.params.email}}).then(function (user) {
    if (!user) {
      return res.status(404).send('Email not found');
    }
    var randomString = user.generateToken();
    var accessUrl = config.clientUrl +"#/reset-password/"+randomString
    emailManager.sendEmailForgotPassword(req.params.email, accessUrl, user.username, function (success, errorMsg) {
      if (!success) {
        console.log(errorMsg);
        res.status(500).send(errorMsg);
        return;
      }
      user.rememberToken = randomString;
      user.save().then(function () {
          res.sendStatus(200);
        }).catch(function (err) {
          res.status(422).send(err);
        });
      });
  }).catch(function (err) {
    res.status(500).send(err);
  });
});

app.get('/users/:id/videos/from/:date', auth.ensureAdminLevelTwo, function (req, res) {
  var dateRange = [moment(req.params.date).toDate(), moment(req.params.date).hour(23).minute(59).seconds(59).toDate()];

  db.video.findAll({
      where: {date: {between: dateRange}, userId: req.params.id},
      raw: true,
      order: [['date', 'asc']]
    })

    .then(function (videos) {
      var result = [];
      videos.forEach(function (video) {
        result.push({
          id: video.id,
          from: moment(video.date).toISOString(),
          to: moment(video.date).add('seconds', video.duration).toISOString()
        });
      });

      res.send(result);
    });
});

app.get('/users/:id/videos/from/:initialDate/:finalDate', auth.ensureAdminLevelTwo, function (req, res) {

  if (!moment(req.params.initialDate).isValid() || !moment(req.params.finalDate).isValid()) {
    console.log('Invalid dates. initial=[' + req.params.initialDate + '] and final=[' + req.params.finalDate + ']');
    return res.sendStatus(400);
  }
  if (moment(req.params.initialDate).isAfter(moment(req.params.finalDate).toDate())) {
    console.log('Invalid range. initial=[' + req.params.initialDate + '] and final=[' + req.params.finalDate + ']');
    return res.sendStatus(400);
  }
  var dateRange = [moment(req.params.initialDate).hour(0).minute(0).seconds(1).toDate(), moment(req.params.finalDate).hour(23).minute(59).seconds(59).toDate()];

  console.log('range=', dateRange);

  db.video.findAll({
      where: {date: {between: dateRange}, userId: req.params.id},
      raw: true,
      order: [['date', 'asc']]
    })

    .then(function (videos) {
      var result = [];
      videos.forEach(function (video) {

        console.log('date = ' + moment(video.date).toISOString());
        console.log('date_to = ' + moment(video.date).add('seconds', video.duration).toISOString());

        result.push({
          id: video.id,
          userId: video.userId,
          from: moment(video.date).toISOString(),
          to: moment(video.date).add('seconds', video.duration).toISOString(),
          isDeleted: video.isDeleted,
          isValid: video.isValid
        });
      });

      res.send(result);
    });
});

app.get('/users/:id/videos/:video.:format', auth.ensureAdminLevelTwo, function (req, res) {
  db.video.find({where: {id: req.params.video}}).then(function (video) {
    if (!video) return res.sendStatus(404);
    var totalSize = 0;
    try {
      totalSize = video.filesize;
    } catch (err) {
      console.log(err);
      console.log('video not found on storage.');
      res.sendStatus(404);
      return;
    }
    var fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
    video.getUser().then(function(user){
      db.history.hasVideoPlayRecently(req.user, user, fullUrl, function(exists){
        if (!exists) {
          db.history.registerVideoPlay(req.user, user, fullUrl);
        }
      });
    });
    try {
      if (req.headers['range']) {
        var range = req.headers.range
          , parts = range.replace(/bytes=/, "").split("-")
          , partialstart = parts[0]
          , partialend = parts[1]
          , start = parseInt(partialstart, 10)
          , end = partialend ? parseInt(partialend, 10) : totalSize - 1
          , chunksize = (end - start) + 1;

        console.log('RANGE: ' + start + ' - ' + end + ' = ' + chunksize);

        storage.readVideoStream(video, function (err, stream) {
          if (err) return res.sendStatus(404);
          //var file = fs.createReadStream(path, {start: start, end: end})

          res.writeHead(206
            , {
              'Content-Range': 'bytes ' + start + '-' + end + '/' + totalSize
              , 'Accept-Ranges': 'bytes', 'Content-Length': chunksize
              , 'Content-Type': 'video/mp4'
            });
          stream.pipe(slice(start, end + 1)).pipe(res);
        });
      } else {
        storage.readVideoStream(video, function (err, stream) {
          if (err) return res.sendStatus(404);
          res.set('Accept-Ranges', 'bytes');
          res.set('Content-Length', totalSize);
          res.set('Content-Type', 'video/mp4');
          return res.send(200);
        });
      }
    } catch (err) {
      console.error(err);
    }
  });
});


