var uuid = require('node-uuid');

module.exports = function(sequelize, DataTypes) {
  var Video = sequelize.define('video', {
    id : {
      type : DataTypes.UUID,
      defaultValue : uuid.v4(),
      primaryKey : true
    },
    date : {
      type : DataTypes.DATE,
      allowNull : false,
        validate:{
            notNull : true,
            notEmpty: true
        }
    },
    duration : {
      type : DataTypes.INTEGER,
      allowNull : false,
        validate:{
            notNull : true,
            notEmpty: true
        }
    },
    isValid : {
      type : DataTypes.BOOLEAN,
      defaultValue : true
    },
    isDeleted : {
      type : DataTypes.BOOLEAN,
      defaultValue : false
    },
    hasIncident : {
      type : DataTypes.BOOLEAN,
      defaultValue : false
    },
    filesize : {
      type : DataTypes.INTEGER,
      allowNull : false,
        validate:{
            notNull : true,
            notEmpty: true
        }
    }
  }, {
    tableName: 'videos',
    timestamps : false,
    associate : function(models) {
      Video.belongsTo(models.user);
    },
    /*instanceMethods : {
      encVideoPath : function() {
        return this.userId + '/' + this.id + '.mp4.enc';
      },
      encAudioPath : function() {
         return this.userId + '/' + this.id + '.m4a.enc';
      },
      videoPath : function() {
        return this.userId + '/' + this.id + '.mp4';
      },
      audioPath : function() {
         return this.userId + '/' + this.id + '.m4a';
      }
    }*/
  });

  Video.prototype.encVideoPath = function() {
        return this.userId + '/' + this.id + '.mp4.enc';
      };
  Video.prototype.encAudioPath = function() {
         return this.userId + '/' + this.id + '.m4a.enc';
      };
  Video.prototype.videoPath = function() {
        return this.userId + '/' + this.id + '.mp4';
      };
  Video.prototype.audioPath = function() {
         return this.userId + '/' + this.id + '.m4a';
      };

  return Video;
}
