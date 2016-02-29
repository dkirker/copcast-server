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
  path = require('path'),
  config = require('../config'),
  _ = require('lodash');


app.get('/exports/:exportId', auth.ensureAdminLevelTwo, function (req, res) {
  db.export.find({where: {id: req.params.exportId},
    include: [
    {model: db.user, as: 'Exporter', attributes: ['id', 'name']},
    {model: db.user, as: 'Recorder', attributes: ['id', 'name']}
  ]}).then(function(exportObj){
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
app.get('/exports/:id/download', auth.ensureAdminLevelTwo, function (req, res) {

  db.export.findById(req.params.id).then(function (exportObj) {
    try{
      var path = 'exported/' + req.user.id + moment(exportObj.createdAt).format('YY-MM-DD_hh-mm-ss')+'.zip';
      var exportPath = fs.readFileSync(path);
      var mimeType = mime.lookup(path);
      res.writeHead(200, {'Content-Type': mimeType });
      res.end(exportPath, 'binary');
    } catch(err) {
      console.log(err);
      res.status(404).send( 'No videos found');
    }
  });
});

app.post('/exports', auth.ensureAdminLevelTwo, function (req, res) {
  var expObj = req.body;
  var dateRange = [moment(expObj.initialDate).toDate(), moment(expObj.finalDate).hour(23).minute(59).seconds(59).toDate()];
  try {
    db.export
      .build({
        exporterId: req.user.id, recorderId: expObj.recorderId,
        initialDate: dateRange[0], finalDate: dateRange[1]
      }).save()
      .then(function (exportObj) {

        db.video.findAll({where: {userId: exportObj.recorderId, date: {between: dateRange}}}).then(function (videos) {
          res.status(200).send(videos);
          if (videos.length > 0) {
            var directory = req.user.id + moment(exportObj.createdAt).format('YY-MM-DD_hh-mm-ss')
            var finished = _.after(videos.length, function () {
              storage.compressAndRemoveDirectory(directory, function (err, hashkey) {
                exportObj.turnAvailable();
                exportObj.filepath = directory;
                exportObj.filehash = hashkey;
                exportObj.expireDate = moment().add(12, 'hours').toDate()
                exportObj.save().then(function () {
                  emailManager.sendEmailExportSuccess(req.user.email, config.clientUrl + '#/exports/' + exportObj.id, req.user.name, function () {
                    console.log("email sent to user: "+ req.user.email)
                  })
                  schedule.scheduledJobs(exportObj.expireDate, expireExport.bind(null, exportObj.id))
                }).error(function () {

                })

              });
            });
            for (var i = 0; i < videos.length; i++) {
              videos[i].getUser().then(function (userRecorder) {
                storage.exportVideoFile(directory, this, userRecorder, req.user, function (err) {
                  console.log(err);
                  finished();
                });
                return null;
              }.bind(videos[i]))
            }
            return null;
          }
          return null;
        });
      }).error(function (err) {
      res.status(500).send(err);
      return null;
    });
  } catch (err){
    emailManager.sendEmailAdmError(err, req.user.name, function(){
      console.log("Error email sent to admin");
    })
    emailManager.sendEmailErrorExport(req.user.email, req.user.name, function(){
      console.log("Error email sent to user: "+ req.user.email)
    })
  }
});




