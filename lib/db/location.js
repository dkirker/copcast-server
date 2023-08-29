module.exports = function(sequelize, DataTypes) {
  var Location = sequelize.define('location', {
    date : {
      type : DataTypes.DATE,
      allowNull : false,
        validate: {
            notNull : true,
            notEmpty: true
        }
    },
    lat : {
      type : DataTypes.FLOAT,
      allowNull : false,
        validate: {
            notNull : true,
            notEmpty: true
        }
    },
    lng : {
      type : DataTypes.FLOAT,
      allowNull : false,
        validate: {
            notNull : true,
            notEmpty: true
        }
    },
    accuracy : {
        type : DataTypes.FLOAT
    },
    satellites : {
        type : DataTypes.INTEGER
    },
    provider : {
        type : DataTypes.STRING
    },
    bearing : {
        type : DataTypes.FLOAT
    },
    speed : {
        type : DataTypes.FLOAT
    },
    userId : {
      type : DataTypes.BIGINT,
      allowNull : false,
        validate: {
            notNull : true,
            notEmpty: true
        }
    }
  }, {
    tableName: 'locations',
    timestamps : false,
    associate : function(models) {
      Location.belongsTo(models.user);
    },
    /*classMethods: {
      parseRequest: function (data, row) {
        if (!data || typeof data !== 'object') {
          return null;
        }

        if (!('lat' in data) ||
            !('lng' in data) ||
            !('date' in data) ||
            (typeof data['lat'] !== 'number') ||
            (typeof data['lng'] !== 'number') ||
            (typeof data['date'] !== 'string') ||
            ('accuracy' in data && typeof data['accuracy'] !== 'number') ||
            ('satellites' in data && typeof data['satellites'] !== 'number') ||
            ('provider' in data && typeof data['provider'] !== 'string') ||
            ('bearing' in data && typeof data['bearing'] !== 'number') ||
            ('speed' in data && typeof data['speed'] !== 'number')) {
          return null;
        }

        if (!row) {
          row = {};
        }

        row.lat = data.lat;
        row.lng = data.lng;
        row.date = data.date;
        if ('accuracy' in data) {
          row.accuracy = data.accuracy;
        }
        if ('satellites' in data) {
          row.satellites = data.satellites;
        }
        if ('provider' in data) {
          row.provider = data.provider;
        }
        if ('bearing' in data) {
          row.bearing = data.bearing;
        }
        if ('speed' in data) {
          row.speed = data.speed;
        }

        return row;
      }
    }*/
  });

  Location.parseRequest = function (data, row) {
        if (!data || typeof data !== 'object') {
          return null;
        }

        if (!('lat' in data) ||
            !('lng' in data) ||
            !('date' in data) ||
            (typeof data['lat'] !== 'number') ||
            (typeof data['lng'] !== 'number') ||
            (typeof data['date'] !== 'string') ||
            ('accuracy' in data && typeof data['accuracy'] !== 'number') ||
            ('satellites' in data && typeof data['satellites'] !== 'number') ||
            ('provider' in data && typeof data['provider'] !== 'string') ||
            ('bearing' in data && typeof data['bearing'] !== 'number') ||
            ('speed' in data && typeof data['speed'] !== 'number')) {
          return null;
        }

        if (!row) {
          row = {};
        }

        row.lat = data.lat;
        row.lng = data.lng;
        row.date = data.date;
        if ('accuracy' in data) {
          row.accuracy = data.accuracy;
        }
        if ('satellites' in data) {
          row.satellites = data.satellites;
        }
        if ('provider' in data) {
          row.provider = data.provider;
        }
        if ('bearing' in data) {
          row.bearing = data.bearing;
        }
        if ('speed' in data) {
          row.speed = data.speed;
        }

        return row;
      };

  return Location;
}
