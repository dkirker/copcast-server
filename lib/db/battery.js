module.exports = function(sequelize, DataTypes) {
  var Battery = sequelize.define('Battery', {
    date : {
      type : DataTypes.DATE,
      allowNull : false
    },
    batteryPercentage : {
      type : DataTypes.FLOAT,
      allowNull : false
    },
    batteryHealth : {
      type : DataTypes.INTEGER,
      allowNull : false
    },
    plugged : {
      type : DataTypes.BOOLEAN
    },
    temperature : {
      type : DataTypes.INTEGER
    }

  }, {
    tableName: 'batteries',
    timestamps : false,
    associate : function(models) {
      Battery.belongsTo(models.user);
    }
  });

  return Battery;
}
