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
    tableName: 'registrations',
    timestamps : false
  });

  return Registration;
}
