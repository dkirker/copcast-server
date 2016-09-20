module.exports = function(sequelize, DataTypes) {
  var Registration = sequelize.define('registration', {
    imei : {
      type : DataTypes.STRING(32),
      allowNull : false,
      primaryKey : true
    },
    simid : {
      type : DataTypes.STRING(32),
      allowNull : false
    },
    public_key : {
      type : DataTypes.STRING(1024),
      allowNull : false
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false
    },
    ipaddress: {
      type: DataTypes.STRING(48),
      allowNull: false
    }
  }, {
    tableName: 'registrations_history',
    timestamps : false,
    classMethods: {
      parseRequest: function (data, row) {
        if (!data || typeof data !== 'object') {
          return null;
        }

        if (!('username' in data) ||
            !('imei' in data) ||
            !('simid' in data) ||
            !('public_key' in data) ||
            (typeof data['imei'] !== 'string') ||
            (typeof data['username'] !== 'string') ||
            (typeof data['simid'] !== 'string') ||
            (typeof data['public_key'] !== 'string')) {
          return null;
        }

        if (!row) {
          row = {};
        }

        row.username = data.username;
        row.imei = data.imei;
        row.simid = data.simid;
        row.public_key = data.public_key;

        return row;
      }
    }
  });

  return Registration;
}
