var moment = require('moment');

module.exports = function (sequelize, DataTypes) {
  var History = sequelize.define('history', {
    previousState: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: 'compositeIndex'
    },
    nextState: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: 'compositeIndex'
    },
    date: {
      type: DataTypes.DATE,
      unique: 'compositeIndex'
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: 'compositeIndex'
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
    classMethods: {
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
      }
    }
  });

  return History;
}
