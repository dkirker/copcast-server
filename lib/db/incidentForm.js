module.exports = function(sequelize, Sequelize) {
  var IncidentForm = sequelize.define('incidentForm', {
    date: {
      type: Sequelize.DATE
    },
    address: {
      type: Sequelize.STRING
    },
    lat: {
      type: Sequelize.FLOAT
    },
    lng: {
      type: Sequelize.FLOAT
    },
    accident: {
      type: Sequelize.BOOLEAN
    },
    gravity: {
      type: Sequelize.INTEGER
    },
    injured: {
      type: Sequelize.INTEGER
    },
    fine: {
      type: Sequelize.BOOLEAN
    },
    fineType: {
      type: Sequelize.STRING
    },
    arrest: {
      type: Sequelize.BOOLEAN
    },
    resistance: {
      type: Sequelize.BOOLEAN
    },
    argument: {
      type: Sequelize.BOOLEAN
    },
    useOfForce: {
      type: Sequelize.BOOLEAN
    },
    useLethalForce: {
      type: Sequelize.BOOLEAN
    },
    userId : {
      type : Sequelize.BIGINT,
      allowNull : false
    }

  }, {
    tableName: 'incidentForm',
    timestamps : true,
    associate : function(models) {
      IncidentForm.belongsTo(models.user);
    }
  });

  return IncidentForm;
}
