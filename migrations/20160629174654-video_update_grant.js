'use strict';
var copcast_db_user = require('../lib/db').sequelize.config.username;

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.sequelize.query('GRANT  UPDATE("hasIncident", "isDeleted") ON videos TO '+copcast_db_user);
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.sequelize.query('REVOKE UPDATE("hasIncident", "isDeleted") ON videos FROM '+copcast_db_user);
  }
};
