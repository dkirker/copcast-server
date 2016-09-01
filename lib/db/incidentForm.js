var keys = [
  'date',
  'address',
  'lat',
  'lng',
  'accident',
  'gravity',
  'injured',
  'fine',
  'fineType',
  'arrest',
  'resistance',
  'argument',
  'useOfForce',
  'useLethalForce'
];

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
    tableName: 'incidentForms',
    timestamps : true,
    associate : function(models) {
      IncidentForm.belongsTo(models.user);
    },
    classMethods: {
      parseRequest: function (data, row) {
        if (!data || typeof data !== 'object') {
          return null;
        }

        if (('date' in data && typeof data['date'] !== 'string') ||
            ('address' in data && typeof data['address'] !== 'string') ||
            ('lat' in data && typeof data['lat'] !== 'number') ||
            ('lng' in data && typeof data['lng'] !== 'number') ||
            ('accident' in data && typeof data['accident'] !== 'boolean') ||
            ('gravity' in data && typeof data['gravity'] !== 'number') ||
            ('injured' in data && typeof data['injured'] !== 'number') ||
            ('fine' in data && typeof data['fine'] !== 'boolean') ||
            ('fineType' in data && typeof data['fineType'] !== 'string') ||
            ('arrest' in data && typeof data['arrest'] !== 'boolean') ||
            ('resistance' in data && typeof data['resistance'] !== 'boolean') ||
            ('argument' in data && typeof data['argument'] !== 'boolean') ||
            ('useOfForce' in data && typeof data['useOfForce'] !== 'boolean') ||
            ('useLethalForce' in data && typeof data['useLethalForce'] !== 'boolean')) {
          return null;
        }

        if (!row) {
          row = {};
        }

        keys.forEach(function(k) {
          row[k] = data[k];
        });

        return row;
      }
    }
  });

  return IncidentForm;
}
