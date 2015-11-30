/**
 * Created by martelli on 9/28/15.
 */
var crypto = require('crypto'),
  readline = require('readline'),
  config = require('../config'),
  counter = 0,
  conjunto = '',
  partitions = config.crypto.partitions;

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

var bootstrap = function(plainkey, callback) {
  var key = crypto.pbkdf2Sync(plainkey, config.crypto.salt, 8192, 256, 'sha256');

  module.exports.decryptor = function() {
    return crypto.createDecipher('aes-256-cbc', key);
  }
  module.exports.encryptor = function() {
    return crypto.createCipher('aes-256-cbc', key);
  }

  //simple decoding test, to avoid entering a wrong master key:
  try {
    var test = config.crypto.challenge;
    var encryptdata = new Buffer(test, 'base64').toString('binary');
    var dec = module.exports.decryptor()
    var msg = dec.update(encryptdata, 'binary', 'utf8');
    msg += dec.final('utf-8');
    if (config.crypto.key)
      console.log(msg);
  } catch(ex) {
    throw new Error('Invalid master key');
  }
  callback();
}

var init = function(cb) {

  if (config.crypto.key) {
    counter = partitions+1;
    conjunto = config.crypto.key;
  }

  counter += 1;
  if (counter > partitions) {
    rl.close();
    bootstrap(conjunto, cb);
  } else {
    rl.question("Key "+counter+":", function(k) {
      conjunto += k;
      init(cb);
    });
  }
};

var challenge = function(callback) {

  var partitions=1;
  var tokens=0;
  var salt;
  keypart = '';
  var message;

  rl.question("Number of key partitions:", function(k) {
    partitions=parseInt(k);
    readmessage();
  }); 

  var readmessage = function() {
    rl.question("Message:", function(k) {
      message = k;
      readsalt();
    }); 
  }

  var readsalt = function() {
    rl.question("Salt:", function(k) {
      salt = k;
      readkeys('');
    }); 
  }

  var readkeys = function(k) {
    tokens += 1;
    keypart += k;

    if (tokens > partitions)
      fim(keypart, salt);
    else {
     rl.question("Password #"+tokens+":", readkeys);
    }
  }

  var fim = function(password, salt) {
    var key = crypto.pbkdf2Sync(password, salt, 8192, 256, 'sha256');
    var enc = crypto.createCipher('aes-256-cbc', key);
    var msg = enc.update(message, 'utf-8', 'base64');
    msg += enc.final('base64');
    callback(password, salt, partitions, msg);
  }
}

module.exports.crypto_init = init;
module.exports.challenge = challenge;
