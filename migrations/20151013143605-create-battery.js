'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.createTable(
      'batteries',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        date: {
          type: Sequelize.DATE
        },
        batteryPercentage: {
          type: Sequelize.FLOAT
        },
        batteryHealth: {
          type: Sequelize.INTEGER
        },
        plugged: {
          type: Sequelize.INTEGER
        },
        temperature: {
          type: Sequelize.INTEGER
        },
        userId: Sequelize.BIGINT,

      },
      {}
    );
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.dropTable('batteries')
  }
};

