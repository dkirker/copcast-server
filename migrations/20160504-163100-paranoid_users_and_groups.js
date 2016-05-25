'use strict';

module.exports = {
  up: function (queryInterface, Sequelize, done) {
    queryInterface.sequelize.query('ALTER TABLE users ADD "deletedAt" timestamp with time zone').then(function() {
      queryInterface.sequelize.query('CREATE VIEW users_active AS SELECT * FROM users WHERE "deletedAt" IS NULL').then(function() {
        queryInterface.sequelize.query('ALTER TABLE groups ADD "deletedAt" timestamp with time zone').then(function() {
          queryInterface.sequelize.query('CREATE VIEW groups_active AS SELECT * FROM groups WHERE "deletedAt" IS NULL').then(function() {
            done();
          });
        });
      });
    });
  },

  down: function (queryInterface, Sequelize, done) {
    queryInterface.sequelize.query('DROP VIEW users_active').then(function() {
      queryInterface.sequelize.query('DROP VIEW groups_active').then(function() {
        queryInterface.sequelize.query('ALTER TABLE users DROP "deletedAt"').then(function() {
          queryInterface.sequelize.query('ALTER TABLE groups DROP "deletedAt"').then(function() {
            done();
          });
        });
      });
    });
  }
};
