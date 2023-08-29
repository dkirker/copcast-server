var fs        = require('fs')
  , path      = require('path')
  , Sequelize = require('sequelize')
  , moment    = require('moment')
  , jwt       = require('jwt-simple')
  , lodash    = require('lodash')
  , config    = require('./../config')
  , sequelize = new Sequelize(config.db, { dialect: 'postgres', omitNull: true, /*logging: false,*/ logging: console.log })
  , db        = {};

fs
  .readdirSync(__dirname)
  .filter(function(file) {
    return (file.indexOf('.') !== 0) && (file !== 'index.js');
  })
  .forEach(function(file) {
console.log("setup db " + file);
    //var model = sequelize.import(path.join(__dirname, file));
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(function(modelName) {
  if (db[modelName].options.hasOwnProperty('associate')) {
    db[modelName].options.associate(db);
  }
});

module.exports = lodash.extend({
  sequelize: sequelize,
  Sequelize: Sequelize
}, db);
