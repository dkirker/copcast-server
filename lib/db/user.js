var crypto = require('crypto');
var Promise = require('promise');

var pbkdf2 = {

  iterations: 512,
  key_size: 256,
  salt_size: 32,
  hash_algo: 'sha1',

//pbkdf2.verify(this.passwordSalt, this.passwordHash, password, function(err, valid) {
  verify: function(salt, hash, password, callback) {

    try {
      var salt_part = salt.split('.')[1];
      var calc_hash = crypto.pbkdf2Sync(password, salt_part, this.iterations, this.key_size, this.hash_algo).toString('base64');
    } catch(err) {
      return callback(err, false);
    }

    return callback(null, calc_hash === hash);
  },

//pbkdf2.secureHash(password, function(err, passwordHash, newSalt) {
  secureHash: function(password, cb) {
    try {
      var salt = crypto.randomBytes(this.salt_size).toString('base64');
      var hash = crypto.pbkdf2Sync(password, salt, this.iterations, this.key_size, this.hash_algo).toString('base64');
    } catch(err) {
      return cb(err, null, null);
    }

    return cb(null, hash, this.iterations.toString(16)+'.'+salt);
  }
}

module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define('user', {
    id : {
      type : DataTypes.BIGINT,
      primaryKey : true,
      autoIncrement : true
    },
    username : {
      type : DataTypes.STRING,
      allowNull : false,
      unique : true
    },
    passwordHash : {
      type : DataTypes.STRING(1024),
      allowNull : false
    },
    passwordSalt : {
      type : DataTypes.STRING(1024),
      allowNull : false
    },
    rememberToken : {
      type : DataTypes.STRING,
      allowNull : true
    },
    name : {
      type : DataTypes.STRING,
      allowNull : false
    },
    email : {
      type : DataTypes.STRING(255),
      unique : true,
      allowNull : false,
      validate : {
          isEmail : true
      }
    },
    isAdmin : {
      type : DataTypes.BOOLEAN,
      defaultValue : false
    },
    lastLat : {
      type : DataTypes.FLOAT
    },
    lastLng : {
      type : DataTypes.FLOAT
    },
    lastLocationUpdateDate : {
      type : DataTypes.DATE
    },
    language : {
      type : DataTypes.STRING(5)
    },
    role : {
      type : DataTypes.STRING(20),
      allowNull : false
    },
    isEnabled : {
      type : DataTypes.BOOLEAN,
      allowNull : false,
      defaultValue: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    paranoid: true,
    associate : function(models) {
      User.hasMany(models.accesstoken);
      User.hasMany(models.location);
      User.hasMany(models.video);
      User.hasMany(models.history);
      User.hasMany(models.incidentForm);
      User.hasMany(models.export, {as: 'Exporter', foreignKey: 'exporterId'});
      User.hasMany(models.export, {as: 'Recorder', foreignKey: 'recorderId'});
      User.belongsTo(models.group);
    },
    instanceMethods : {
      validatePassword : function(password, done) {
        pbkdf2.verify(this.passwordSalt, this.passwordHash, password, function(err, valid) {
          return done(valid);
        });
      },
      hashPassword : function(password, done) {
        var self = this;
        pbkdf2.secureHash(password, function(err, passwordHash, newSalt) {
          self.passwordHash = passwordHash;
          self.passwordSalt = newSalt;
          return done(err);
        });
      },
      hashPromise : function(password) {
        var self = this;
        return new Promise(function(fulfill, reject) {
          self.hashPassword(password, function(err) {
              if (err)
                reject(err);
              else
                fulfill();
          });
        });
      },
      generateToken: function() {
        var buf = new Buffer(16);
        for (var i = 0; i < buf.length; i++) {
          buf[i] = Math.floor(Math.random() * 256);
        }
        var id = buf.toString('base64').replace('/', '-');
        return id;
      },
      canModifyThisUser: function(user){
        if (!user.isAdmin) {
          return true;
        } else if (this.role === 'admin_3'){
          return ['admin_3', 'admin_2', 'admin_1', 'mobile'].indexOf(user.role) > -1;
        } else if (this.role === 'admin_2') {
          return [ 'admin_1', 'mobile'].indexOf(user.role) > -1;
        } else if (this.role === 'admin_1') {
          return [ 'mobile'].indexOf(user.role) > -1;
        }
        return false;
      }, getAvailableAdminRoles : function(){
        var roles = [];
        if (this.role === 'admin_3'){
          roles = ['admin_3', 'admin_2', 'admin_1'];
        } else if (this.role === 'admin_2') {
          roles = ['admin_1'];
        } else if (this.role === 'admin_1') {
          roles = [ ];
        }
        return roles;
      }, getAvailableRoles : function(){
        var roles = this.getAvailableAdminRoles()
        roles.push('mobile')
        return roles;
      }, getAvailablePermissions : function(){
        var roles = [];
        if (this.role === 'admin_3'){
          roles = ['admin_3', 'admin_2', 'admin_1'];
        } else if (this.role === 'admin_2') {
          roles = ['admin_1', 'admin_2'];
        } else if (this.role === 'admin_1') {
          roles = [ 'admin_1'];
        }
        return roles;
      }
    },
    hooks: {
      beforeValidate:  function(user, options) {
        if (!user.isAdmin){
          user.role = 'mobile';
        }
      }

    }
  });

return User;
};
