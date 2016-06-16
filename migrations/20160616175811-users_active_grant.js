'use strict';
var copcast_db_user = require('../lib/db').sequelize.config.username;

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.sequelize.query('GRANT SELECT ON users_active TO '+copcast_db_user);
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.sequelize.query('REVOKE SELECT ON users_active FROM '+copcast_db_user);
  }
};
