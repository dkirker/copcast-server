/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , app = express()
  , server = http.createServer(app)
  , io = require('socket.io')(server, {'pingInterval': 2000, 'pingTimeout': 5000})
  , passport = require('passport')
  , db = require('./lib/db')
  , config = require('./lib/config')
  , cookieParser = require('cookie-parser')
  , logger = require('morgan')
  , methodOverride = require('method-override')
  , errorHandler = require('errorhandler')
  , bodyParser = require('body-parser')
  , rabbitmq = require('./lib/rabbitmq')
  , exportUtils = require('./lib/exports/exportUtils.js')
  , videoJobs = require('./lib/videos/jobs')
  , crypto = require('./lib/crypto');


// Express configuration

var allowCrossDomain = function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Headers", "Authorization, Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");

  // intercept OPTIONS method
  if ('OPTIONS' == req.method) {
    res.sendStatus(200);
  }
  else {
    next();
  }
};

console.log("Starting copcast-server v");

console.log("Setup Express...");
//if (process.env.PORT == null) {
//  console.warn('process.env.PORT is null!');
//}
app.set('port', config.port);
app.set('address', config.address);
app.use(logger('dev'));
app.use(allowCrossDomain);
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride());
app.use(passport.initialize());
//if ('development' == app.get('env')) {
  app.use(errorHandler({dumpExceptions: true, showStack: true}));
//}

// Passport configuration
var auth = require('./lib/auth');

console.log("Setup Express routes...");

app.use('/images', express.static(__dirname + '/images'));

app.post('/token', auth.tokenEndpoint);
app.use(require('./lib/config/wizard'));
app.use(require('./lib/home'));
app.use(require('./lib/users'));
app.use(require('./lib/videos'));
app.use(require('./lib/locations'));
app.use(require('./lib/histories'));
app.use(require('./lib/incidents'));
app.use(require('./lib/reports'));
app.use(require('./lib/groups'));
app.use(require('./lib/heartbeats'));
app.use(require('./lib/batteries'));
app.use(require('./lib/incidentForms'));
app.use(require('./lib/logreports'));
app.use(require('./lib/registrations'));
app.use(require('./lib/exports'));

console.log("Setup socket.io...");

streams = require('./lib/streams/streams.js')();


require('./lib/streams/socketHandler.js')(io, auth, streams);

app.set('sockets', io.sockets);
app.set('streams', streams);

var option = {force: false};

var init_server = function() {
  server.listen(app.get('port'), app.get('address'), function () {
    console.log('Express server listening at address ' + app.get('address') + ' on port ' + app.get('port'));
    exportUtils.loadExpireJobs();
    videoJobs.loadDeleteOldVideosJob();
  });
}

console.log("Setup db...");

db.sequelize.sync(option).then(function () {
console.log("sequelize sync");
  crypto.crypto_init(function () {
console.log("crypto_init");
    if ('rabbitmq' in config && config.rabbitmq.enabled) {

      rabbitmq.init(function () {
        init_server();
      });

    } else {
      init_server();
    }
  });
});
