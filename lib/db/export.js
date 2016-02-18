module.exports = function(sequelize, DataTypes) {
  var Export = sequelize.define('export', {
    exporterId: {
      type: Sequelize.INTEGER
    },
    recorderId: {
      type: Sequelize.INTEGER
    },
    initialDate: {
      type: Sequelize.DATE
    },
    finalDate: {
      type: Sequelize.DATE
    },
    status: {
      type: Sequelize.STRING
    },
    createdAt: {
      type: Sequelize.DATE
    }
  }, {
    tableName: 'exports',
    timestamps : true,
    associate : function(models) {
      Export.belongsTo(models.user, {as: 'Exporter', foreignKey: 'exporterId'});
      Export.belongsTo(models.user, {as: 'Recorder', foreignKey: 'recorderId'});
    },
    hooks: {
      beforeCreate:  function(exportObj, options) {
        exportObj.status = 'PENDING';
      }

    }
  });

  return Export;
}
