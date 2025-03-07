const { Op } = require('sequelize');

/**
 * Created by brunosiqueira on 19/02/16.
 */
var express = require('express'),
  app = module.exports = express(),
  db = require('./../db'),
  auth = require('./../auth'),
  emailManager = require('./../utils/email_manager'),
  storage = require('./../videos/storage'),
  moment = require('moment'),
  fs = require('fs'),
  schedule = require('node-schedule'),
  mime = require('mime'),
  config = require('../config'),
  exportUtils = require('./../exports/exportUtils'),
  _ = require('lodash');


app.get('/exports/:exportId', auth.ensureAdminLevelThree, function (req, res) {
  db.export.findOne({
    where: {id: req.params.exportId, status: 'AVAILABLE', exporterId: req.user.id},
    include: [
      {model: db.user, as: 'Exporter', attributes: ['id', 'name']},
      {model: db.user, as: 'Recorder', attributes: ['id', 'name']}
    ]
  }).then(function (exportObj) {
    if (exportObj && req.user.id == exportObj.exporterId) {
      res.status(200).send(exportObj);
    } else {
      res.sendStatus(403);
    }
  });
});

app.get('/exports', auth.ensureAdminLevelThree, function (req, res) {

  var page = req.query.page ? parseInt(req.query.page) : 1;
  var perPage = req.query.perPage ? parseInt(req.query.perPage) : 20;

  db.export.findAndCountAll({
    where: {exporterId: req.user.id},
    include: [
      {model: db.user, as: 'Exporter', attributes: ['id', 'name']},
      {model: db.user, as: 'Recorder', attributes: ['id', 'name']}
    ],
    limit: perPage,
    offset: (page - 1) * perPage,
    order: [['createdAt', 'desc']]
  }).then(function (exports) {
    res.status(200).send(exports);
  });
});


app.get('/exports/:id/download', auth.ensureAdminLevelThree, function (req, res) {

  db.export.findOne({where: {id: req.params.id, status: 'AVAILABLE'}}).then(function (exportObj) {
    try {
      var path = 'exported/' + req.user.id + moment(exportObj.createdAt).format('YY-MM-DD_hh-mm-ss') + '.zip';
      var exportPath = fs.readFileSync(path);
      var mimeType = mime.lookup(path);
      res.writeHead(200, {'Content-Type': mimeType});
      res.end(exportPath, 'binary');
    } catch (err) {
      console.log(err);
      res.status(404).send('No videos found');
    }
  });
});

function _processVideos(videos,directory, currentUser, done) {
  if (videos.length == 0){
    return done();
  }
  var video = videos.pop();

  video.getUser().then(function (userRecorder) {
    storage.exportVideoFile(directory, this, userRecorder, currentUser, function (err) {
      console.log('Finished export video');
      if (err) {
        console.error(err);
      }
      _processVideos(videos,directory, currentUser, done);
    });
    return null;
  }.bind(video));


}
app.post('/exports', auth.ensureAdminLevelThree, function (req, res) {
  var expObj = req.body;
  var dateRange = [moment.utc(expObj.initialDate).toDate(), moment.utc(expObj.finalDate).toDate()];
  console.log('Period for export: '+expObj.initialDate+ ' '+ expObj.finalDate + ' and recorder: '+ expObj.recorderId);

  try {
    db.video.findAll({where: {userId: expObj.recorderId, date: { [Op.between]: dateRange}}}).then(function (videos) {
      console.log('Videos returned: ' + videos.length);
      if (videos.length > 0) {
        db.export
          .build({
            exporterId: req.user.id, recorderId: expObj.recorderId,
            initialDate: dateRange[0], finalDate: dateRange[1]
          }).save()
          .then(function (exportObj) {
            res.status(200).send(videos);
            var directory = req.user.id + moment(exportObj.createdAt).format('YY-MM-DD_hh-mm-ss');
            _processVideos(videos,directory,req.user, function(){
              console.log('Finished export zip file');
              storage.compressAndRemoveDirectory(directory, function (err, hashkey) {
                if (err){
                  console.error(err);
                }
                exportObj.turnAvailable();
                exportObj.filepath = directory;
                exportObj.filehash = hashkey;
                exportObj.expireDate = moment().add(1, 'week').toDate();
                exportObj.save().then(function () {
                  emailManager.sendEmailExportSuccess(req.user.email, config.clientUrl + '/#/exports/' + exportObj.id, req.user.name, function () {
                    console.log("email sent to user: " + req.user.email);
                  });
                  schedule.scheduleJob(exportObj.expireDate, exportUtils.expireExport.bind(null, exportObj.id));
                });
              });
            });

            return null;
          }).catch(function (err) {
            res.status(500).send(err);
            return null;
          });;
      } else {
        res.status(200).send([]);
      }
    }).catch(function (err) {
      res.status(500).send(err);
      return null;
    });
  } catch (err) {
    console.log(err);
    emailManager.sendEmailAdmError(err, req.user.name, function () {
      console.log("Error email sent to admin");
    });
    emailManager.sendEmailErrorExport(req.user.email, req.user.name, function () {
      console.log("Error email sent to user: " + req.user.email)
    });
  }
});




