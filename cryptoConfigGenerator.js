


var crypt = require('./lib/crypto')

crypt.challenge(function (key, salt, partitions, challenge, encalgo, kl, hashalgo) {
  console.log('"crypto": {\n' +
    '  "partitions": ' + partitions + ',\n' +
    '  "key": "' + key + '",\n' +
    '  "challenge": "' + challenge + '",\n' +
    '  "salt": "' + salt + '"\n' +
    '  "encryption_algorithm": "' + encalgo + '"\n' +
    '  "key_length": "' + kl + '"\n' +
    '  "key_hash_algorithm": "' + hashalgo + '"\n' +
    '}\n'
  );
  process.exit();
});

