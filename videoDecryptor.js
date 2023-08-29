var crypto = require('./lib/crypto'),
  fs = require('node-fs'),
  glob = require('glob'),
  config = require('./lib/config'),
  db = require('./lib/db');

var run = function() {

  glob("videos/3/*.enc", {}, function (er, files) {

    if (er)
      console.log(er);

    files.forEach(function(outf) {

      var videosize = fs.statSync(outf).size;
      var out = fs.createWriteStream(outf.replace('.enc', ''));

      var path_split = outf.replace('.mp4.enc', '').split('/');
      var v_id = path_split[path_split.length-1];

      out.on('finish', function() {
        if (outf.indexOf('.mp4')>0) {
            console.log("File '" + outf + "' done.");
        }
      });

      var ec = crypto.decryptor();
      ec.on('error', function(err) {
        console.log(err);
      });
      ec.on('finish', function(err) {
        console.log(outf+' decrypted.');
      });

      fs.createReadStream(outf).pipe(ec).pipe(out);
    });
  });
}

crypto.crypto_init(run);
