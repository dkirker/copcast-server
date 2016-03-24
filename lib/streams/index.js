var express = require('express'),
    app = module.exports = express(),
    db = require('./../db'),
    config = require('./../config'),
    gcm = new require('node-gcm'),
    sender = new gcm.Sender(config.googleApiKey),
    auth = require('./../auth');


app.post('/streams/:userId/start', auth.ensureAdminLevelOne, function (req, res) {
  if (app.get('streams').getByUserId(req.params.userId)){
    res.status(200).send({
      stream: {
        id : req.params.userId,
        streamUrl: "rtmp://"+config.wowza.ipAddress+":"+config.wowza.port+config.wowza.path+req.params.userId+".stream"
      }
    });
  } else {
    db.user.findById(req.params.userId).then(function (user) {
      sender.send(new gcm.Message({collapseKey: "startStreaming"}), [user.gcmRegistration], 4, function (err, result) {
        if (err || !result) {
          res.status(500).send({message: 'Unable to request streaming'});
        } else {
          res.status(200).send({
            message: "Waiting for user's response.",
            streamUrl: "rtmp://"+config.wowza.ipAddress+":"+config.wowza.port+config.wowza.path+req.params.userId+".stream"
          });
        }
      });
    });
  }
});

app.post('/streams/:userId/stop', auth.ensureAdminLevelOne, function (req, res) {
    db.user.findById(req.params.userId).then(function (user) {
        sender.send(new gcm.Message({ collapseKey : "stopStreaming"}), [user.gcmRegistration], 4, function(err, result) {
            if ( err || !result ) {
                res.status(500).send( { message : 'Unable to request streaming' });
            }

            res.status(200).send( { message : 'Stream finished.'});
        });
    });
});


