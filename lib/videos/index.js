var express = require('express'),
  app = module.exports = express(),
  fs = require('node-fs'),
  db = require('./../db'),
  auth = require('./../auth'),
  storage = require('./storage'),
  formidable = require('formidable'),
  ffmpeg = require('fluent-ffmpeg'),
  moment = require('moment'),
  uuid = require('node-uuid'),
  multer = require('multer'),
  config = require('../config'),
  upload = multer({dest: config.securestore}),
  _ = require('lodash');

app.post('/videos', auth.ensureUser, function (req, res) {
  var form = new formidable.IncomingForm();

  form.parse(req, function (err, fields, files) {
    if (err) {
      return res.status(500).send({message: 'Could not upload video.', error: err});
    }

    var videoFile = files.video;
    //var audioFile = files.audio;
    var dateRecorded = moment(fields.date);

    // get metadata. this is good check to see if the video is valid
    ffmpeg.ffprobe(videoFile.path, function (err, metadata) {
      if (err) return res.status(500).send({message: 'Invalid video'});

      db.video.create({id: uuid.v4(), date: dateRecorded.toISOString(), duration: Math.ceil(metadata.format.duration)})
        .then(function (video) {
          video.setUser(req.user);
          storage.createVideoStream(videoFile.path, video, metadata, function (streamError) {
            if (streamError) {
              video.destroy();
              console.log('STREAMERR:', streamError.message);
              res.status(500).send({message: 'Unable to store video'});
            } else {
              res.sendStatus(201);
            }
          });
        });
    });
  });
});

app.post('/videos/export/:userId/:initialDate/:endDate', auth.ensureAdminLevelTwo, upload.single('video'), function (req, res) {
  req.sendStatus(200);
  var dateRange = [moment(req.params.initialDate).toDate(), moment(req.params.finalDate).toDate()];
  db.video.findAll({where: {userId: req.params.userId, date: {between: dateRange}}}).then(function (videos) {
    if (videos.length > 0) {
      db.export.create({
        exporterId: req.user.id, recorderId: req.params.userId,
        initialDate: dateRange[0], finalDate: dateRange[1]
      }).then(function (exportObj) {
        var directory = req.params.userId + moment(exportObj.createdAt).format('YY-MM-DD_hh-mm-ss')
        var finished = _.after(videos.length, function () {
          storage.compressAndRemoveDirectory(directory);
          //TODO send email with link
        });
        for (var i = 0; i < videos.length; i++) {
          videos[i].getUser().then(function (userRecorder) {
            storage.exportVideoFile(directory, this, userRecorder, req.user, function (err) {
              console.log(err);
              finished();
            });
          }.bind(videos[i]))
        }
      });
    }
  });
});

app.get('/videos/export/:exportId', auth.ensureAdminLevelTwo, upload.single('video'), function (req, res) {
  db.export.findById(req.params.exportId).then(function(exportObj){
    if (exportObj && req.user.id == exportObj.exporterId){
      res.status(200).send(exportObj);
    } else {
      res.sendStatus(403);
    }
  });
});

app.get('/videos/export', auth.ensureAdminLevelTwo, upload.single('video'), function (req, res) {
  var page = req.query.page || 0,
  pageSize = req.query.pageSize || 25;
  db.export.findAll({where: {exporterId: req.user.id}, include: [{model: db.user, as: 'Exporter'},
    {model: db.user, as: 'Recorder'}] }).then(function(exports){
      res.status(200).send(exports);
  });
});

app.post('/videos/:user', auth.ensureUser, upload.single('video'), function (req, res) {

  var videoFile = req.file;
  var dateRecorded = moment(videoFile.originalname.replace('.mp4', ''), 'YYYY-MM-DD_HH-mm-ss');
  db.user.find({where: {username: req.params.user}}).then(function(user){
    storage.ingestVideo(videoFile.path, user, dateRecorded, function (code, err) {
      if (err != null) {
        console.log('erro:' + err);
      }
      return res.sendStatus(code);
    })
  });
});
