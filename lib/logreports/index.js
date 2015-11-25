/**
 * Created by alex on 11/24/15.
 */
var express = require('express'),
  app = module.exports = express(),
  db = require('./../db'),
  _ = require('lodash'),
  auth = require('./../auth'),
  config = require('./../config');


// list all histories log
app.get('/logreports/:initialDate/:finalDate', auth.ensureAdmin, function(req,res) {

  console.log("req=", req);

  if(!moment(req.params.initialDate).isValid() || !moment(req.params.finalDate).isValid()) {
    console.log('Invalid dates. initial=['+req.params.initialDate+'] and final=['+req.params.finalDate+']');
    return res.sendStatus(400);
  }
  if(moment(req.params.initialDate).isAfter(moment(req.params.finalDate).toDate())){
    console.log('Invalid range. initial=['+req.params.initialDate+'] and final=['+req.params.finalDate+']');
    return res.sendStatus(400);
  }

  var dateRange = [ moment(req.params.initialDate).hour(0).minute(0).seconds(1).toDate(), moment(req.params.finalDate).hour(23).minute(59).seconds(59).toDate() ];

  console.log("dataRange=", dateRange);
  console.log("req.params.id=", req.params.id);

  db.history.findAll({
    include: [{
      model: db.user,
      include:{
        model: db.group,
        where: {
          'isAdmin': true,
          'id':req.user.groupId
        }
      }
    }],
    where:
      Sequelize.and({date : { between : dateRange }} )

  })

    .then(function(logreports) {
      console.log("send200 = ", logreports);
      res.send(logreports);
    }).error(function(err) {
      console.log(err);
      res.sendStatus(500);
    });
});


//list the logreports
app.get('/logreports', auth.ensureAdmin, function (req, res) {

  db.history.findAll(
    {
      limit:20,
      include: [{
        model: db.user,
        include:{
          model: db.group,
          where: {
            'isAdmin': true,
            'id':req.user.groupId
          }
        }
        ,
        raw : true
      }]
    }).then(function(result)
    {
      console.log(".history.findAll=", result);
      res.send(result);

    });

});

