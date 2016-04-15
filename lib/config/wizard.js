var express = require('express'),
  app = module.exports = express(),
  config = require('./../config'),
  fs = require('fs'),
  db = require('./../db'),
  auth = require('./../auth'),
  Promise = require('promise'),
  readFile = Promise.denodeify(require('fs').readFile),
  writeFile = Promise.denodeify(require('fs').writeFile);


app.get('/config', function(req, res) {
  if ( config.configured ) {
    return res.status(400).send({ message : "Server already configured"});
  }
  res.sendfile(__dirname + '/views/wizard.html');
});

app.post('/config', function(req, res) {
  if ( config.configured ) {
    return res.status(400).send({ message : "Server already configured" });
  }

  db.sequelize.transaction(function (t) {

    var group = db.group.build({
      name: req.body.admin.groupName,
      lat: req.body.admin.groupLat,
      lng: req.body.admin.groupLng,
      isAdmin: true
    });

    return group.save({transaction: t}).then(function (newGroup) {
      var admin = db.user.build({
        username: req.body.admin.username,
        name: req.body.admin.name,
        email: req.body.admin.email,
        role: 'admin_3',
        isAdmin: true
      });

      return admin.hashPromise(req.body.admin.password).then(function () {
        return admin.save().then(function (newAdmin) {

          newAdmin.setGroup(newGroup);
          // get the config file of the current environment
          var envJson = __dirname + '/../../config/' + process.env.NODE_ENV + '.json';

          return readFile(envJson).then(function(data) {

            data = JSON.parse(data);
            data.configured = true;

            return writeFile(envJson, JSON.stringify(data, null, 2)).then(function() {
              config.configured = true;
            });
          });
        });
      });
    });

  }).then(function(result) {
    return res.sendStatus(200);
  }).catch(function(err) {
    console.error(err)
    return res.status(500).send({message: "Could not save admin user"});
  }); // transaction
});
