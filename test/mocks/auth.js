var auth = {};

auth.user = null;
auth.scope = null;

auth.ensureToken = function(req, res, next) {
  if ( !auth.scope || !auth.user ) return res.sendStatus(401);
  req.user = auth.user;
  req.authInfo = { scope : auth.scope };
  next();
};

auth.ensureUser = function(req, res, next) {
  if ( !auth.scope || !auth.user ) return res.sendStatus(401);
  req.user = auth.user;
  req.authInfo = { scope : auth.scope };
  next();
};

auth.ensureAdmin = function(req, res, next) {
  if ( !auth.scope || !auth.user ) return res.sendStatus(401);
  if (auth.scope == 'android') return res.sendStatus(403);
  req.user = auth.user;
  req.authInfo = { scope : auth.scope }
  next();
};

auth.ensureAdminLevelOne = function(req, res, next) {
  if ( !auth.scope || !auth.user ) return res.sendStatus(401);
  if (auth.scope == 'android') return res.sendStatus(403);
  if (['admin_1'].indexOf(auth.user.role) == -1) return res.sendStatus(403);
  req.user = auth.user;
  req.authInfo = { scope : auth.scope }
  next();
};

auth.ensureAdminLevelTwo = function(req, res, next) {
  if ( !auth.scope || !auth.user ) return res.sendStatus(401);
  if (auth.scope == 'android') return res.sendStatus(403);
  if (['admin_1', 'admin_2'].indexOf(auth.user.role) == -1) return res.sendStatus(403);
  req.user = auth.user;
  req.authInfo = { scope : auth.scope }
  next();
};

auth.ensureAdminLevelThree = function(req, res, next) {
  if ( !auth.scope || !auth.user ) return res.sendStatus(401);
  if (auth.scope == 'android') return res.sendStatus(403);
  if (['admin_1', 'admin_2', 'admin_3'].indexOf(auth.user.role) == -1) return res.sendStatus(403);
  req.user = auth.user;
  req.authInfo = { scope : auth.scope }
  next();
};


module.exports = auth;
