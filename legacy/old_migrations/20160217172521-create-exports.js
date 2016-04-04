'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.createTable(
      'exports',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        exporterId: {
          type: Sequelize.INTEGER
        },
        recorderId: {
          type: Sequelize.INTEGER
        },
        initialDate: {
          type: Sequelize.DATE
        },
        finalDate: {
          type: Sequelize.DATE
        },
        expireDate: {
          type: Sequelize.DATE
        },
        status: {
          type: Sequelize.STRING
        },
        filepath: {
          type: Sequelize.STRING
        },
        filehash: {
          type: Sequelize.STRING
        },
        createdAt: {
          type: Sequelize.DATE
        },
        updatedAt: {
          type: Sequelize.DATE
        }
      },
      {}
    );
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.dropTable('exports')
  }
};
