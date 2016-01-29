var crypto = require('crypto'),
    db = require('../db');

var verify = function(body) {

  var maci = body.mac;
  delete body.mac;

    pre = '-----BEGIN PUBLIC KEY-----\n';
    post = '-----END PUBLIC KEY-----';

    verify = crypto.createVerify('SHA256');

    verify.write(JSON.stringify(body));
    verify.end();

    return db.registration.findOne({where: {imei: body.imei, simid: body.simid}}).then(function (record) {

      var pubkey = new Buffer(pre+record.public_key+post);
      var mac = new Buffer(maci, 'base64');

      return verify.verify(pubkey, mac);
    });
}


module.exports.verify = verify;