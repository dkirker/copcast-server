var moment = require('moment');

const { Op } = require('sequelize');

module.exports = function (sequelize, DataTypes) {
  var History = sequelize.define('history', {
    previousState: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: 'compositeIndex',
        validate: {
            notNull : true,
            notEmpty: true
        }
    },
    nextState: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: 'compositeIndex',
        validate: {
            notNull : true,
            notEmpty: true
        }
    },
    date: {
      type: DataTypes.DATE,
      unique: 'compositeIndex'
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: 'compositeIndex',
        validate: {
            notNull : true,
            notEmpty: true
        }
    },
    extras: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'histories',
    timestamps: false,
    associate: function (models) {
      History.belongsTo(models.user);
    },
    /*classMethods: {
      registerAdminLoggin: function (user) {
        this.build({
          nextState: 'LOGGED_ADMIN', previousState: 'NOT_LOGGED', userId: user.id, date: moment.utc().toDate()
        }).save();
      },
      registerVideoPlay: function (player, recorder, fullUrl) {
        this.build({
          nextState: 'PLAYING_VIDEO',
          previousState: 'LOGGED',
          userId: player.id,
          date: moment.utc().toDate(),
          extras: JSON.stringify({
            videoName: fullUrl, userId: recorder.id, userName: recorder.name
          })
        }).save();
      },
      hasVideoPlayRecently: function(player, recorder, fullUrl, callback){
        this.count({where: {
          nextState: 'PLAYING_VIDEO',
          previousState: 'LOGGED',
          userId: player.id,
          extras: JSON.stringify({
            videoName: fullUrl, userId: recorder.id, userName: recorder.name
          }),
          date: {[Op.gte]: moment.utc().subtract(5, 'minutes').toDate()}}}).then(function(c){
            callback(c>0);
        });
      },
      parseRequest: function (data, row) {
        if (!data || typeof data !== 'object') {
          return null;
        }

        if (!('nextState' in data) ||
            !('previousState' in data) ||
            (typeof data['nextState'] !== 'string') ||
            (typeof data['previousState'] !== 'string') ||
            ('date' in data && typeof data['date'] !== 'string') ||
            ('extras' in data && typeof data['extras'] !== 'object')) {
          return null;
        }

        if (!row) {
          row = {};
        }

        row.nextState = data.nextState
        row.previousState = data.previousState
        row.date = data.date
        row.extras = JSON.stringify(data.extras)

        return row;
      }
    }*/
  });

  History.registerAdminLoggin = function (user) {
        this.build({
          nextState: 'LOGGED_ADMIN', previousState: 'NOT_LOGGED', userId: user.id, date: moment.utc().toDate()
        }).save();
      };
  History.registerVideoPlay = function (player, recorder, fullUrl) {
        this.build({
          nextState: 'PLAYING_VIDEO',
          previousState: 'LOGGED',
          userId: player.id,
          date: moment.utc().toDate(),
          extras: JSON.stringify({
            videoName: fullUrl, userId: recorder.id, userName: recorder.name
          })
        }).save();
      };
  History.hasVideoPlayRecently = function(player, recorder, fullUrl, callback) {
        this.count({where: {
          nextState: 'PLAYING_VIDEO',
          previousState: 'LOGGED',
          userId: player.id,
          extras: JSON.stringify({
            videoName: fullUrl, userId: recorder.id, userName: recorder.name
          }),
          date: {[Op.gte]: moment.utc().subtract(5, 'minutes').toDate()}}}).then(function(c){
            callback(c>0);
        });
      };
  History.parseRequest = function (data, row) {
        if (!data || typeof data !== 'object') {
          return null;
        }

        if (!('nextState' in data) ||
            !('previousState' in data) ||
            (typeof data['nextState'] !== 'string') ||
            (typeof data['previousState'] !== 'string') ||
            ('date' in data && typeof data['date'] !== 'string') ||
            ('extras' in data && typeof data['extras'] !== 'object')) {
          return null;
        }

        if (!row) {
          row = {};
        }

        row.nextState = data.nextState
        row.previousState = data.previousState
        row.date = data.date
        row.extras = JSON.stringify(data.extras)

        return row;
      };

  return History;
}
