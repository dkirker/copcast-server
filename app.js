/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , app = express()
  , server = http.createServer(app)
  , io = require('socket.io')(server, {origins: '*:*', 'pingInterval': 2000, 'pingTimeout': 5000})
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
  //,	streams = require('./lib/streams/streams.js')();
  , crypto = require('./lib/crypto')
  , wss = require('./lib/websocket')


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

if (process.env.PORT == null) {
  console.warn('process.env.PORT is null!');
}
app.set('port', process.env.PORT || 3000);
app.use(logger('dev'));
app.use(allowCrossDomain);
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride());
app.use(passport.initialize());
if ('development' == app.get('env')) {
  app.use(errorHandler({dumpExceptions: true, showStack: true}));
}

// Passport configuration
var auth = require('./lib/auth');

app.post('/token', auth.tokenEndpoint);
app.use(require('./lib/config/wizard'));
app.use(require('./lib/users'));
app.use(require('./lib/streams'));
app.use(require('./lib/videos'));
app.use(require('./lib/locations'));
app.use(require('./lib/histories'));
app.use(require('./lib/incidents'));
app.use(require('./lib/reports'));
app.use(require('./lib/groups'));
app.use(require('./lib/heartbeats'));
app.use(require('./lib/batteries'));
app.use(require('./lib/incidentForms'))
app.use(require('./lib/pictures'));
app.use(require('./lib/logreports'));
app.use(require('./lib/registrations'));
app.use(require('./lib/exports'));

streams = require('./lib/streams/streams.js')();


require('./lib/streams/socketHandler.js')(io, auth, streams);

app.set('sockets', io.sockets);
app.set('streams', streams);

var option = {force: false};

var init_server = function() {
  server.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
    exportUtils.loadExpireJobs();
  });
}

db.sequelize.sync(option).then(function () {

  crypto.crypto_init(function () {

    if ('rabbitmq' in config && config.rabbitmq.enabled) {

      rabbitmq.init(function () {
        init_server();
      });

    } else {
      init_server();
    }
  });
});
