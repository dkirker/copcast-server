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
    }
  }, {
    tableName: 'registrations',
    timestamps : false
  });

  return Registration;
}
