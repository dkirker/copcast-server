'use strict';

module.exports = {
  up: function (queryInterface, Sequelize, done) {
    queryInterface.createTable(
      'incidents',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        date: {
          type: Sequelize.DATE
        },
        lat : {
          type : Sequelize.FLOAT
        },
        lng : {
          type : Sequelize.FLOAT
        },
        userId: {
          type: Sequelize.BIGINT,
          references: {
            model: 'users',
            key: 'id'
          }
        },

      }
    ).then(function() {
        done();
      });
  },

  down: function (queryInterface, Sequelize, done) {
    queryInterface.dropTable('incidents').then(function() {
      done();
    })  }
};
