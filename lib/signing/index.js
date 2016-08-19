var crypto = require('crypto'),
  config = require('../config'),
  db = require('../db');

var verify = function(req, res, next) {

  if (!config.signatureVerification) {
    console.warn("Message authentication ignored.");
    return next();
  }

  // Whitelist only string values to mitigate JSON SQL Injection
  // http://blog.kazuhooku.com/2014/07/the-json-sql-injection-vulnerability.html
  if ((typeof req.body.mac) !== 'string' ||
      (typeof req.body.imei) !== 'string' ||
      (typeof req.body.simid) !== 'string') {
    return res.sendStatus(403);
  }

  var maci = req.body.mac;
  delete req.body.mac;

  // Validate length of mac signature.
  if (maci.length > 1024) {
    return res.sendStatus(403);
  }

  var pre = '-----BEGIN PUBLIC KEY-----\n';
  var post = '-----END PUBLIC KEY-----';

  verify = crypto.createVerify('SHA256');

  verify.write(JSON.stringify(req.body).replace(/\//g, '\\/'));
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
