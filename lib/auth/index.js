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
          return done(null, false, {message: 'incorrect_password'});
      }
      user.validatePassword(password, function(valid) {
        if (!valid ) {
          done(null, false);
          return null;
        }

        if ( req.body.scope && req.body.scope.indexOf('admin') > -1 && !user.isAdmin ) {
          return done(null, false, {message: 'no_permission'});
        }
        if (!user.isEnabled){
          return done(null, false, {message: 'not_enabled'});
        }
        if (!user.isEnabled){
          return done(null, false, {message: 'not_enabled'});
        }
        done(null, user);
        return null;
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
    return done(null, false, {message: 'invalid_token'});
  }

  if ( decodedToken.exp < moment().add('m', 10).valueOf() ) {
    console.log("Expired token", decodedToken.exp, moment().add('m', 10).valueOf());
    return done(null, false, {message: 'expired_token'});
  }

  db.accesstoken.findOne({ where: { id: decodedToken.sub } }).then(function(token) {
    if (!token) {
      done(null, false);
      return null;
    }

    if (token.expirationDate < new Date()) {
      done(null, false);
      return null;
    }

    token.getUser().then(function(user) {
      if (!user) return done(null, false, {message: 'not_found'});
      if (!user.isEnabled){
        return done(null, false, {message: 'not_enabled'});
      }
      var info = { scope : token.scope };
      done(null, user, info);
    });
  });
};

exports.hasLevel = function(user, level){
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
    if (!exports.hasLevel(user, level)){
      return res.status(403).send("no_permission");
    } else if (!user.isEnabled){
      return res.status(403).send("not_enabled");
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

      res.status(200).send( {token: encodedToken, userId: req.user.id,
        userName: req.user.name, role: req.user.role
      });
      return null;
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
