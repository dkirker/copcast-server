/**
 * Module dependencies.
 */
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , BearerStrategy = require('passport-http-bearer').Strategy
  , moment = require('moment')
  , db = require('./../db')
  , config = require('./../config')
  , jwt = require('jwt-simple')
  , uuid = require('node-uuid');


/**
 * LocalStrategy
 *
 * Validates the user and creates the accessToken
 */
passport.use(new LocalStrategy({ passReqToCallback: true },
  function(req, username, password, done) {
    db.user.find({ where : { username : username}}).then(function(user) {
      if (!user) {
          return done(null, false);
      }
      user.validatePassword(password, function(valid) {
        if (!valid ) return done(null, false);
        if ( req.body.scope && req.body.scope.indexOf('admin') > -1 && !user.isAdmin ) {
          return done(null, false);
        }
        return done(null, user);
      });
    });
  }
));

/**
 * BearerStrategy
 *
 * Validates the token
 */
var validateBearerToken = function(accessToken, done) {
  var decodedToken = null;

  try {
    decodedToken = jwt.decode(accessToken, config.tokenSecret);
  } catch(err) {
    console.log("Invalid token");
    return done(null, false);
  }

  if ( decodedToken.exp < moment().add('m', 10).valueOf() ) {
    console.log("Expired token", decodedToken.exp, moment().add('m', 10).valueOf());
    return done(null, false);
  }

  db.accesstoken.findOne({ where: { id: decodedToken.sub } }).then(function(token) {
    if (!token) return done(null, false);
    if (token.expirationDate < new Date()) return done(null, false);

    token.getUser().then(function(user) {
      if (!user) return done(null, false);

      var info = { scope : token.scope };
      done(null, user, info);
    });
  });
};

var hasLevel = function(user, level){
  var roles = user.getAvailablePermissions();
  return roles.indexOf(level) > -1;
};

exports.ensureAdminLevelOne =  function (req, res, next){
  ensureAdminLevel(req, res, next, 'admin_1');
};
exports.ensureAdminLevelTwo =  function (req, res, next){
  ensureAdminLevel(req, res, next, 'admin_2');
};
exports.ensureAdminLevelThree =  function (req, res, next){
  ensureAdminLevel(req, res, next, 'admin_3');
};

var ensureAdminLevel = function (req, res, next, level) {

  console.log(decodeURIComponent(req.headers.cookie).split('globals')[1]);

  // Hack to allow the videoUrl to be authenticated.
  // If a request comes without the 'Authentication:' header,
  // we fetch it from inside the cookie header.

  if (req.headers.authorization == undefined) {
    try {
      var tkn = JSON.parse(decodeURIComponent(req.headers.cookie).split('globals')[1].split('=')[1].split(';')[0]).currentUser.token;
      req.headers['authorization'] = 'Bearer '+tkn;
    } catch(err) {
      console.error(err);
    }
  }

  passport.authenticate('bearer', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) { return res.sendStatus(401); }
    if (!hasLevel(user, level)){
      return res.status(403).send("no_permission");
    }

    req.user = user;
    next();
  })(req, res, next);
};


passport.use(new BearerStrategy(validateBearerToken));

exports.validateToken = validateBearerToken;

exports.tokenEndpoint = [
  passport.authenticate('local', { session : false }),
  function (req, res) {
    var expiration = moment().add('m', config.tokenDuration);
    db.accesstoken.create({
      id: uuid.v4(),
      scope : req.body.scope,
      expirationDate : expiration.toDate(),
      userId: req.user.id
    }).then(function (token) {
        var encodedToken = jwt.encode({
            iss : config.tokenIssuer,
            sub : token.id,
            exp : expiration.valueOf()
        }, config.tokenSecret);

        if ( req.body.scope === 'client' && req.body.gcm_registration ) {
            req.user.gcmRegistration = req.body.gcm_registration;
            req.user.save(['gcmRegistration']);
        }

        res.status(200).send( {token: encodedToken,
          userName: req.user.name,
          ipAddress: config.wowza.ipAddress,
          streamingPort: config.wowza.port,
          streamingUser: config.wowza.user,
          streamingPassword: config.wowza.password,
          streamingPath: config.wowza.path + req.user.id + '.stream',
          role: req.user.role
         });
    });
  }
];

exports.ensureToken = passport.authenticate('bearer', { session : false });

//exports.ensureAdmin = function (req, res, next) {
//
//  console.log(decodeURIComponent(req.headers.cookie).split('globals')[1]);
//
//  // Hack to allow the videoUrl to be authenticated.
//  // If a request comes without the 'Authentication:' header,
//  // we fetch it from inside the cookie header.
//
//  if (req.headers.authorization == undefined) {
//    try {
//      var tkn = JSON.parse(decodeURIComponent(req.headers.cookie).split('globals')[1].split('=')[1].split(';')[0]).currentUser.token;
//      req.headers['authorization'] = 'Bearer '+tkn;
//    } catch(err) {
//      console.error(err);
//    }
//  }
//
//  passport.authenticate('bearer', function(err, user, info) {
//    if (err) { return next(err); }
//    if (!user) { return res.sendStatus(401); }
//    if ( req.authInfo && req.authInfo.scope && req.authInfo.scope.indexOf('admin') === -1 ) {
//      return res.status(401).send("invalid_scope");
//    }
//    req.user = user;
//    next();
//  })(req, res, next);
//};

exports.ensureUser = function (req, res, next) {
  passport.authenticate('bearer', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) { return res.sendStatus(401); }

    req.user = user;
    next();
  })(req, res, next);
};
