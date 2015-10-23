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
    }
  });

  return Incident;
}
