var crypt = require('./lib/crypto')

crypt.challenge(function(key, salt, partitions, challenge) {
  console.log('"crypto": {\n' +
    '  "partitions": '+partitions+',\n'+
    '  "key": "'+key+'",\n'+
    '  "challenge": "'+challenge+'",\n'+
    '  "salt": "'+salt+'"\n'+
  '}\n'
);
  process.exit();
});

