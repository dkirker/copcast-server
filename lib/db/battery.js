module.exports = function(sequelize, DataTypes) {
  var Battery = sequelize.define('battery', {
    date : {
      type : DataTypes.DATE,
      allowNull : false,
      unique: 'timeIndex'
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
      type : DataTypes.INTEGER
    },
    temperature : {
      type : DataTypes.INTEGER
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull : false,
      unique: 'timeIndex'
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
