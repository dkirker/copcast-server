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
  rabbitmq = require('../rabbitmq');

var upload = multer({dest: config.securestore}),
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



app.post('/videos/:user', auth.ensureUser, upload.single('video'), function (req, res) {

    var videoFile = req.file;
    var dateRecorded = moment(videoFile.originalname.replace('.mp4', ''), 'YYYY-MM-DD_HH-mm-ss');
    db.user.find({where: {username: req.params.user}}).then(function(user){
      // use rabbit if it's enabled
      if ('rabbitmq' in config && config.rabbitmq.enabled) {
        console.log("Sending to RabbitMQ");
        rabbitmq.push({path: videoFile.path, user: user, date: dateRecorded});
        return res.sendStatus(201);
      } else {
        // otherwise resort to old direct ingestion
        console.log("Ingesting video");
        storage.ingestVideo(videoFile.path, user, dateRecorded, function (code, err) {
          if (err != null)
            console.log('error ingesting video:' + err);
          return res.sendStatus(code);
        });
      }
    });
  }
);
