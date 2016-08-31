module.exports = function(sequelize, DataTypes) {
  var Incident = sequelize.define('incident', {
    date : {
      type : DataTypes.DATE,
      allowNull : false
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull : false
    },
    lat : {
      type : DataTypes.FLOAT,
      allowNull : false
    },
    lng : {
      type : DataTypes.FLOAT,
      allowNull : false
    }

  }, {
    tableName: 'incidents',
    timestamps : false,
    associate : function(models) {
      Incident.belongsTo(models.user);
    },
    classMethods: {
      parseRequest: function (data, row) {
        if (!data || typeof data !== 'object') {
          return null;
        }

        if (!('date' in data) ||
            !('lat' in data) ||
            !('lng' in data) ||
            (typeof data['date'] !== 'string') ||
            (typeof data['lat'] !== 'number') ||
            (typeof data['lng'] !== 'number')) {
          return null;
        }

        if (!row) {
          row = {};
        }

        row.date = data.date
        row.lat = data.lat
        row.lng = data.lng

        return row;
      }
    }
  });

  return Incident;
}
