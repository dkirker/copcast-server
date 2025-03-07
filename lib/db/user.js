var crypto = require('../auth/crypto');
var Promise = require('promise');

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
      unique : true,
        validate: {
            notNull : true,
            notEmpty: true
        }
    },
    passwordHash : {
      type : DataTypes.STRING(1024),
      allowNull : false,
        validate: {
            notNull : true,
            notEmpty: true
        }
    },
    passwordSalt : {
      type : DataTypes.STRING(1024),
      allowNull : false,
        validate: {
            notNull : true,
            notEmpty: true
        }
    },
    rememberToken : {
      type : DataTypes.STRING,
      allowNull : true
    },
    name : {
      type : DataTypes.STRING,
      allowNull : false,
        validate: {
            notNull : true,
            notEmpty: true
        }
    },
    email : {
      type : DataTypes.STRING(255),
      unique : true,
      allowNull : false,
      validate: {
          notNull : true,
          notEmpty: true,
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
      allowNull : false,
        validate: {
            notNull : true,
            notEmpty: true
        }
    },
    isEnabled : {
      type : DataTypes.BOOLEAN,
      allowNull : false,
      defaultValue: true,
        validate: {
            notNull : true,
            notEmpty: true
        }
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
    /*instanceMethods : {
      validatePassword : function(password, done) {
        crypto.verify(this.passwordSalt, this.passwordHash, password, function(err, valid) {
          return done(valid);
        });
      },
      hashPassword : function(password, done) {
        var self = this;
        crypto.secureHash(password, function(err, passwordHash, newSalt) {
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
    },*/
    hooks: {
      beforeValidate:  function(user, options) {
        if (!user.isAdmin){
          user.role = 'mobile';
        }
      }

    },
    /*classMethods: {
      parseRequest: function (data, row) {
        if (!data || typeof data !== 'object') {
          return null;
        }

        if (!('username' in data) ||
            !('email' in data) ||
            !('name' in data) ||
            !('groupId' in data) ||
            ('language' in data && typeof data['language'] !== 'string') ||
            ('isAdmin' in data && typeof data['isAdmin'] !== 'boolean') ||
            (typeof data['groupId'] !== 'number') ||
            (typeof data['username'] !== 'string') ||
            (typeof data['email'] !== 'string') ||
            (typeof data['name'] !== 'string') ||
            ('role' in data && typeof data['role'] !== 'string')) {
          return null;
        }

        if (!row) {
          row = {};
        }

        row.username = data.username;
        row.email = data.email;
        row.name = data.name;
        row.role = data.role;
        row.groupId = data.groupId;
        if (data.language) {
          row.language = data.language;
        }
        if (data.isAdmin) {
          row.isAdmin = data.isAdmin;
        }

        return row;
      }
    }*/
  });

  // Instance Methods
  User.prototype.validatePassword = function(password, done) {
        crypto.verify(this.passwordSalt, this.passwordHash, password, function(err, valid) {
          return done(valid);
        });
      };
  User.prototype.hashPassword = function(password, done) {
        var self = this;
        crypto.secureHash(password, function(err, passwordHash, newSalt) {
          self.passwordHash = passwordHash;
          self.passwordSalt = newSalt;
          return done(err);
        });
      };
  User.prototype.hashPromise = function(password) {
        var self = this;
        return new Promise(function(fulfill, reject) {
          self.hashPassword(password, function(err) {
              if (err)
                reject(err);
              else
                fulfill();
          });
        });
      };
  User.prototype.generateToken = function() {
        var buf = new Buffer(16);
        for (var i = 0; i < buf.length; i++) {
          buf[i] = Math.floor(Math.random() * 256);
        }
        var id = buf.toString('base64').replace('/', '-');
        return id;
      };
  User.prototype.canModifyThisUser = function(user){
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
      };
  User.prototype.getAvailableAdminRoles = function(){
        var roles = [];
        if (this.role === 'admin_3'){
          roles = ['admin_3', 'admin_2', 'admin_1'];
        } else if (this.role === 'admin_2') {
          roles = ['admin_1'];
        } else if (this.role === 'admin_1') {
          roles = [ ];
        }
        return roles;
      };
  User.prototype.getAvailableRoles = function(){
        var roles = this.getAvailableAdminRoles()
        roles.push('mobile')
        return roles;
      };
  User.prototype.getAvailablePermissions = function(){
        var roles = [];
        if (this.role === 'admin_3'){
          roles = ['admin_3', 'admin_2', 'admin_1'];
        } else if (this.role === 'admin_2') {
          roles = ['admin_1', 'admin_2'];
        } else if (this.role === 'admin_1') {
          roles = [ 'admin_1'];
        }
        return roles;
      };

  // Class Methods
  User.parseRequest = function (data, row) {
        if (!data || typeof data !== 'object') {
          return null;
        }

        if (!('username' in data) ||
            !('email' in data) ||
            !('name' in data) ||
            !('groupId' in data) ||
            ('language' in data && typeof data['language'] !== 'string') ||
            ('isAdmin' in data && typeof data['isAdmin'] !== 'boolean') ||
            (typeof data['groupId'] !== 'number') ||
            (typeof data['username'] !== 'string') ||
            (typeof data['email'] !== 'string') ||
            (typeof data['name'] !== 'string') ||
            ('role' in data && typeof data['role'] !== 'string')) {
          return null;
        }

        if (!row) {
          row = {};
        }

        row.username = data.username;
        row.email = data.email;
        row.name = data.name;
        row.role = data.role;
        row.groupId = data.groupId;
        if (data.language) {
          row.language = data.language;
        }
        if (data.isAdmin) {
          row.isAdmin = data.isAdmin;
        }

        return row;
      };

return User;
};
