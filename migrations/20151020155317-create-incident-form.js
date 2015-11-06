'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable('incidentForms', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: Sequelize.BIGINT
      },
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
      updatedAt: {
        type: Sequelize.DATE
      }
    });
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.dropTable('incidentForms');
  }
};
