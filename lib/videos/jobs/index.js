/**
 * Created by brunosiqueira on 08/06/16.
 */
var fs = require('node-fs'),
  db = require('./../../db'),
  moment = require('moment'),
  config = require('./../../config'),
  schedule = require('node-schedule'),
  path = require('path');

var periodOfRetention = config.periodOfRetention;
var basePath = path.resolve(__dirname, '../../../videos') + '/';

module.exports.loadDeleteOldVideosJob = function(){
  if (!periodOfRetention){
    console.log('could not find periodOfRetention in config. Will not delete old videos');
    return;
  }
  var rule = new schedule.RecurrenceRule();
  rule.dayOfWeek = 0;
  schedule.scheduleJob(rule, deleteOldVideos)
}

function deleteOldVideos(){
  console.log('checking if can delete videos');
  var dateLimit = moment.utc().subtract(periodOfRetention, 'days');
  db.video.findAll({where: {
    date: { $lte: dateLimit.toDate()},
    $and: [
  {$or: [{ isDeleted: false}, {isDeleted: null}]},
  {$or: [{ hasIncident: false}, {hasIncident: null}]} ]
  }}).then(function(videos){
    for(var i = 0; i<videos.length; i++){
      var video = videos[i];
      db.incident.findOne({where: {
        date: {$gte: moment(video.date).subtract(1, 'hour').toDate(),
          $lte: moment(video.date).add(1, 'hour').toDate()},
        userId: video.userId
      }})
        .then(function(video, incident){
          if (!incident) {
            video.isDeleted = true;
            console.log('removing video ', video.encVideoPath(), basePath);
            try {
              fs.unlinkSync(basePath + video.encVideoPath());
              fs.unlinkSync(basePath + video.encAudioPath());
            }catch (err) {
              console.error(err);
              //in case a corrupted file is uploaded
              try {
                fs.unlinkSync(basePath + video.videoPath());
              } catch(err){
                console.error(err);
              }
            }
          } else {
            video.hasIncident = true;
          }
          video.save();
        }.bind(null, video));
    }
  });
}
