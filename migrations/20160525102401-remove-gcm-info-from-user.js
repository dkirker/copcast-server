'use strict';

module.exports = {
  up: function (queryInterface, Sequelize, done) {
    return queryInterface.sequelize.query('DROP VIEW users_active').then(
      queryInterface.removeColumn('users', 'gcmRegistration')).then(
        queryInterface.sequelize.query('CREATE VIEW users_active AS SELECT * FROM users WHERE "deletedAt" IS NULL'));
  },

  down: function (queryInterface, Sequelize, done) {

    return queryInterface.sequelize.query('DROP VIEW users_active').then(
      queryInterface.addColumn('users', 'gcmRegistration', Sequelize.STRING(1024))).then(
        queryInterface.sequelize.query('CREATE VIEW users_active AS SELECT * FROM users WHERE "deletedAt" IS NULL'));
  }
};
