module.exports = function(sequelize, DataTypes) {
  var Group = sequelize.define('group', {
    id : {
      type : DataTypes.INTEGER,
      primaryKey : true,
      autoIncrement : true
    },
    name : {
      type : DataTypes.STRING(255),
      allowNull : false,
      unique : true
    },
    isAdmin : {
      type : DataTypes.BOOLEAN
    },
    lat : {
      type : DataTypes.FLOAT
    },
    lng : {
      type : DataTypes.FLOAT
    },
    isDeleted : {
      type : DataTypes.BOOLEAN,
      defaultValue : false
    }
  }, {
    // groups_active is a SQL view on groups selecting rows with isDeleted=false
    tableName: 'groups_active',
    associate : function(models) {
      Group.hasMany(models.user);
    }
  });

  return Group;
};
