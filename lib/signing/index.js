var crypto = require('crypto'),
  config = require('../config'),
  db = require('../db');

var verify = function(req, res, next) {

  if (!config.signatureVerification) {
    console.warn("Message authentication ignored.");
    return next();
  }

  var maci = req.body.mac;
  delete req.body.mac;

    pre = '-----BEGIN PUBLIC KEY-----\n';
    post = '-----END PUBLIC KEY-----';

    verify = crypto.createVerify('SHA256');

    verify.write(JSON.stringify(req.body));
    verify.end();

    return db.registration.findOne({where: {imei: req.body.imei, simid: req.body.simid}}).then(function (record) {

      var pubkey = new Buffer(pre+record.public_key+post);
      var mac = new Buffer(maci, 'base64');

      if (verify.verify(pubkey, mac)) {
        next();
        return null;
      } else {
        console.log('MAC verification FAILED:\n'+
        '\tUser: '+req.user.username+'\n'+
        '\tIMEI: '+req.body.imei+'\n'+
        '\tSimID: '+req.body.simid);
        return res.sendStatus(403);
      }
    }).catch(function(err) {
      console.log('signing fail: '+err);
      return res.sendStatus(403);
    });
}


module.exports.verify = verify;
