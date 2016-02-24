module.exports = function(sequelize, Sequelize) {
  var Export = sequelize.define('export', {
    exporterId: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    recorderId: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    initialDate: {
      type: Sequelize.DATE,
      allowNull: false
    },
    finalDate: {
      type: Sequelize.DATE,
      allowNull: false
    },
    status: {
      type: Sequelize.STRING
    },
    createdAt: {
      type: Sequelize.DATE
    },
    updatedAt: {
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

    },
    instanceMethods: {
      turnAvailable: function(){
        this.status = 'AVAILABLE';
      },
      turnExpired: function(){
        this.status = 'EXPIRED';
      },
      turnUnavailable: function(){
        this.status = 'UNAVAILABLE';
      }
    }
  });

  return Export;
}
