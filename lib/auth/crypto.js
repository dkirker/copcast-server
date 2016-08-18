var crypto = require('crypto');

module.exports = {
  iterations: 512,
  key_size: 256,
  salt_size: 32,
  hash_algo: 'sha1',
  default_password_salt: '200.EP+9cn1htwmjd3yhV2eWVKy1ozBq6rHP27jEK9UPEPQ=',
  default_password_hash: '5xQPakqxSn+c4wFkFardSkO6Z96hExW/Ei/kAL98UnRYaGr+UC5OujXQc8bRM7sRr4N3UJGNxLkPYJuC+JMcyLSR+0Hz7zcZzWqI367kjUKiEGJWF9uddKTHlBANtZsiMrPASgZw7gZyS8pDNXNVsO753eb7mwg5jVLFcDpEEsRaP2HvotrPbsruA0Mp4rc0EU+CYOlooRnFZT+zxbzWa06rCewV12guvzhYuEDmLC+nBhYPhHsWy99+UY5p1GtZ1uxsgbyX3skGals0QzGoS5nzMCx/PvNLLrJh5OhC03EUozXGqhi9VyIm2WKRCd8ZGJbMna2gGRW2yE4gUeHtbg==',

  verify: function (salt, hash, password, callback) {
    'use strict';
    try {
      var salt_part = salt.split('.')[1],
        calc_hash = crypto.pbkdf2Sync(password, salt_part, this.iterations, this.key_size, this.hash_algo).toString('base64');
      return callback(null, calc_hash === hash);
    } catch (err) {
      return callback(err, false);
    }
  },

  secureHash: function (password, callback) {
    'use strict';
    try {
      var salt = crypto.randomBytes(this.salt_size).toString('base64'),
        hash = crypto.pbkdf2Sync(password, salt, this.iterations, this.key_size, this.hash_algo).toString('base64');
      return callback(null, hash, this.iterations.toString(16) + '.' + salt);
    } catch (err) {
      return callback(err, null, null);
    }
  }
};
