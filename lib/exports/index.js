/**
 * Created by brunosiqueira on 19/02/16.
 */
var express = require('express'),
  app = module.exports = express(),
  fs = require('node-fs'),
  db = require('./../db'),
  auth = require('./../auth'),
  storage = require('./../videos/storage'),
  formidable = require('formidable'),
  ffmpeg = require('fluent-ffmpeg'),
  moment = require('moment'),
  uuid = require('node-uuid'),
  multer = require('multer'),
  config = require('../config'),
  upload = multer({dest: config.securestore}),
  _ = require('lodash');


app.get('/exports/:exportId', auth.ensureAdminLevelTwo, upload.single('video'), function (req, res) {
  db.export.findById(req.params.exportId).then(function(exportObj){
    if (exportObj && req.user.id == exportObj.exporterId){
      res.status(200).send(exportObj);
    } else {
      res.sendStatus(403);
    }
  });
});

app.get('/exports', auth.ensureAdminLevelTwo,  function (req, res) {

  var page = req.query.page ? parseInt(req.query.page) : 1;
  var perPage = req.query.perPage ? parseInt(req.query.perPage) : 20

  db.export.findAll({where: {exporterId: req.user.id},
    include: [
      {model: db.user, as: 'Exporter', attributes: ['id', 'name']},
      {model: db.user, as: 'Recorder', attributes: ['id', 'name']}
    ],
    limit: perPage,
    offset: (page - 1) * perPage,
    order: [['createdAt', 'desc']] }).then(function(exports){
    res.status(200).send(exports);
  });
});

app.get('/exports/:id', auth.ensureAdminLevelTwo, function (req, res) {
  db.export.find({id: req.params.id, exporterId: req.user.id}).then(function(exportObj){
    if (exportObj) {
      res.status(200).send(exportObj);
    } else {
      res.sendStatus(403);
    }
  }).error(function(err){
    res.status(500).send(err);
  });
});

app.post('/exports', auth.ensureAdminLevelTwo, function (req, res) {
  var exportObj = req.body;
  exportObj.exporterId = req.user.id;
  db.export
    .build(req.body)
    .save()
    .then(function() {

      var dateRange = [moment(exportObj.initialDate).toDate(), moment(exportObj.finalDate).hour(23).minute(59).seconds(59).toDate()];
      db.video.findAll({where: {userId: exportObj.recorderId, date: {between: dateRange}}}).then(function (videos) {
        res.status(200).send(videos);
        if (videos.length > 0) {

          db.export.create({
            exporterId: exportObj.exporterId, recorderId: exportObj.userId,
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
          }).error(function(err){
            console.log(err)
          });
        }
      });
    }).error(function(err){
      res.status(500).send( err);
    });

});
