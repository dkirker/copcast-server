module.exports = function(sequelize, DataTypes) {
  var Group = sequelize.define('group', {
    id : {
      type : DataTypes.INTEGER,
      primaryKey : true,
      autoIncrement : true
    },
    name : {
      type : DataTypes.STRING(255),
      allowNull : false,
      unique : true,
        validate: {
            notNull : true,
            notEmpty: true
        }
    },
    isAdmin : {
      type : DataTypes.BOOLEAN
    },
    lat : {
      type : DataTypes.FLOAT
    },
    lng : {
      type : DataTypes.FLOAT
    }
  }, {
    tableName: 'groups',
    timestamps: true,
    paranoid: true,
    associate : function(models) {
      Group.hasMany(models.user);
    },
    /*classMethods: {
      parseRequest: function (data, row) {
        if (!data || typeof data !== 'object') {
          return null;
        }

        if (!('name' in data) ||
             (typeof data['name'] !== 'string') ||
             ('lat' in data && typeof data['lat'] !== 'number') ||
             ('lng' in data && typeof data['lng'] !== 'number') ||
             ('isAdmin' in data && typeof data['isAdmin'] !== 'boolean')) {
          return null;
        }

        if (!row) {
          row = {};
        }

        row.name = data.name;
        row.isAdmin = data.isAdmin;
        row.lat = data.lat;
        row.lng = data.lng;

        return row;
      }
    }*/
  });

  Group.parseRequest = function (data, row) {
        if (!data || typeof data !== 'object') {
          return null;
        }

        if (!('name' in data) ||
             (typeof data['name'] !== 'string') ||
             ('lat' in data && typeof data['lat'] !== 'number') ||
             ('lng' in data && typeof data['lng'] !== 'number') ||
             ('isAdmin' in data && typeof data['isAdmin'] !== 'boolean')) {
          return null;
        }

        if (!row) {
          row = {};
        }

        row.name = data.name;
        row.isAdmin = data.isAdmin;
        row.lat = data.lat;
        row.lng = data.lng;

        return row;
      };


  return Group;
};
