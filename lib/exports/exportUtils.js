/**
 * Created by brunosiqueira on 25/02/16.
 */
var db = require('./../db'),
  storage = require('./../videos/storage'),
  schedule = require('node-schedule');

var exportUtils = {}
exportUtils.expireExport = function(id){

  db.export.findByPk(id).then(function(exportObj){
    storage.deleteZipFile(exportObj.filepath, function(){
      exportObj.turnExpired();
      exportObj.save();
    })
  });
}

exportUtils.loadExpireJobs = function(){
  db.export.findAll({where: {status: 'AVAILABLE'}}).then(function(exportList){
    if (exportList) {
      for (var i = 0; i < exportList.length; i++) {
        schedule.scheduleJob(exportList[i].expireDate, exportUtils.expireExport.bind(null, exportList[i].id))
      }
    }
  });
}

module.exports = exportUtils;
