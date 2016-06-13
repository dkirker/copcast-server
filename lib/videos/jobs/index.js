/**
 * Created by brunosiqueira on 08/06/16.
 */
var fs = require('node-fs'),
  db = require('./../../db'),
  moment = require('moment'),
  config = require('./../../config'),
  schedule = require('node-schedule'),
  path = require('path');

var periodOfRetention = 5//config.periodOfRetention || 90;
var basePath = path.resolve(__dirname, '../../../videos') + '/';

module.exports.loadDeleteOldVideosJob = function(){
  // var rule = new schedule.RecurrenceRule();
  // rule.dayOfWeek = 0;
  // schedule.scheduleJob(rule, deleteOldVideos)
  deleteOldVideos();
}
function deleteOldVideos(){
  console.log('checking if can delete videos');
  var dateLimit = moment.utc().subtract(periodOfRetention, 'days');
  db.video.findAll({where: {date: { $lte: dateLimit.toDate()}, }}).then(function(videos){
    for(var i = 0; i<videos.length; i++){
      var video = videos[i];
      db.incident.findOne({where: {date: {$lte: moment(video.date).subtract(1, 'hour').toDate(), gte: moment(video.date).add(1, 'hour').toDate()}}})
        .then(function(video, incident){
          if (!incident) {
            video.isDeleted = true;
            console.log('removing video ', video.date);
            fs.unlinkSync(path.dirname(basePath + video.encVideoPath()));
            fs.unlinkSync(path.dirname(basePath + video.encAudioPath()));
            //in case a corrupted file is uploaded
            fs.unlinkSync(path.dirname(basePath + video.videoPath()));
          } else {
            video.hasIncident = true;
          }
          video.save();
        }.bind(null, video));
    }
  });
}
