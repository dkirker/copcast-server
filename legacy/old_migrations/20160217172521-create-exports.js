'use strict';
var copcast_db_user = require('../lib/db').sequelize.config.username;

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
    ).then(function() {
      queryInterface.sequelize.query("GRANT SELECT,INSERT,UPDATE ON exports TO "+copcast_db_user);
    });
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.dropTable('exports')
  }
};
