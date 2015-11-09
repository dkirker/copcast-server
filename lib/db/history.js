module.exports = function(sequelize, DataTypes) {
    var History = sequelize.define('history', {
        previousState : {
            type : DataTypes.STRING,
            allowNull : false,
            unique: 'compositeIndex'
        },
        nextState : {
            type : DataTypes.STRING,
            allowNull : false,
            unique: 'compositeIndex'
        },
        date: {
            type : DataTypes.DATE,
            unique: 'compositeIndex'
        },
        userId: {
          type: DataTypes.BIGINT,
          allowNull : false,
          unique: 'compositeIndex'
        }

    }, {
        tableName: 'histories',
        timestamps : false,
        associate : function(models) {
            History.belongsTo(models.user);
        }
    });

    return History;
}
