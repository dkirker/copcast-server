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


app.get('/exports/:exportId', auth.ensureAdminLevelTwo, function (req, res) {
  db.export.find({
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

app.get('/exports', auth.ensureAdminLevelTwo, function (req, res) {

  var page = req.query.page ? parseInt(req.query.page) : 1;
  var perPage = req.query.perPage ? parseInt(req.query.perPage) : 20

  db.export.findAll({
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


app.get('/exports/:id/download', auth.ensureAdminLevelTwo, function (req, res) {

  db.export.find({where: {id: req.params.id, status: 'AVAILABLE'}}).then(function (exportObj) {
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

app.post('/exports', auth.ensureAdminLevelTwo, function (req, res) {
  var expObj = req.body;
  var dateRange = [moment.utc(expObj.initialDate).hour(0).minute(0).seconds(0).toDate(), moment.utc(expObj.finalDate).hour(23).minute(59).seconds(59).toDate()];
  console.log('Period for export: '+expObj.initialDate+ ' '+ expObj.finalDate + ' and recorder: '+ expObj.recorderId);

  try {
    db.video.findAll({where: {userId: expObj.recorderId, date: {between: dateRange}}}).then(function (videos) {
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
            var finished = _.after(videos.length, function () {
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
                  emailManager.sendEmailExportSuccess(req.user.email, config.clientUrl + '#/exports/' + exportObj.id, req.user.name, function () {
                    console.log("email sent to user: " + req.user.email);
                  });
                  schedule.scheduleJob(exportObj.expireDate, exportUtils.expireExport.bind(null, exportObj.id));
                });
              });
            });
            for (var i = 0; i < videos.length; i++) {
              videos[i].getUser().then(function (userRecorder) {
                storage.exportVideoFile(directory, this, userRecorder, req.user, function (err) {
                  console.log('Finished export video');
                  if (err) {
                    console.error(err);
                  }
                  finished();
                });
                return null;
              }.bind(videos[i]));
            }
            return null;
          }).error(function (err) {
            res.status(500).send(err);
            return null;
          });;
      } else {
        res.status(200).send([]);
      }
    }).error(function (err) {
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




