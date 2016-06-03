var express = require('express'),
  app = module.exports = express();

app.get('/', function(req, res) {
  res.sendfile(__dirname + '/views/index.html');
});
