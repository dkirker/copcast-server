/**
 * Created by brunosiqueira on 25/02/16.
 */
var db = require('./../db'),
  storage = require('./../videos/storage'),
  schedule = require('node-schedule');

var exportUtils = {}
exportUtils.expireExport = function(id){

  db.export.find(id).then(function(exportObj){
    storage.delete(exportObj.filepath, function(){
      exportObj.turnExpired();
      exportObj.save();
    })
  });
}

exportUtils.loadExpireJobs = function(){
  db.export.find({status: 'AVAILABLE'}).then(function(exportList){
    for (var i = 0; i < exportList.length; i++){
      schedule.scheduledJobs(exportList[i].expireDate,exportUtils.expireExport.bind(null, exportList[i].id) )
    }
  });
}

module.exports = exportUtils;
