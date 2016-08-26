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
    },
    classMethods: {
      parseRequest: function (data, row) {
        if (!data || typeof data !== 'object') {
          return false;
        }

        if (!('batteryHealth' in data) ||
              !('batteryPercentage' in data) ||
              !('temperature' in data) ||
              !('status' in data) ||
              !('plugged' in data) ||
              !('date' in data) ||
              (typeof data['batteryHealth'] !== 'number') ||
              (typeof data['batteryPercentage'] !== 'number') ||
              (typeof data['temperature'] !== 'number') ||
              (typeof data['status'] !== 'number') ||
              (typeof data['plugged'] !== 'number') ||
              (typeof data['date'] !== 'string')) {
          return null;
        }

        if (!row) {
          row = {};
        }

        row.batteryHealth = data.batteryHealth;
        row.batteryPercentage = data.batteryPercentage;
        row.temperature = data.temperature;
        row.status = data.status;
        row.plugged = data.plugged;
        row.date = data.date;

        return row;
      }
    }
  });

  return Battery;
}
