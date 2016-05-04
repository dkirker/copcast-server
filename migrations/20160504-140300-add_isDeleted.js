'use strict';

module.exports = {
  up: function (queryInterface, Sequelize, done) {
    queryInterface.sequelize.query('ALTER TABLE users ADD "isDeleted" boolean DEFAULT false').then(function() {
      queryInterface.sequelize.query('CREATE VIEW users_active AS SELECT * FROM users WHERE "isDeleted"=false').then(function() {
        queryInterface.sequelize.query('ALTER TABLE groups ADD "isDeleted" boolean DEFAULT false').then(function() {
          queryInterface.sequelize.query('CREATE VIEW groups_active AS SELECT * FROM groups WHERE "isDeleted"=false').then(function() {
            done();
          });
        });
      });
    });
  },

  down: function (queryInterface, Sequelize, done) {
    queryInterface.sequelize.query('ALTER TABLE users DROP "isDeleted"').then(function() {
      queryInterface.sequelize.query('DROP VIEW users_active').then(function() {
        queryInterface.sequelize.query('ALTER TABLE groups DROP "isDeleted"').then(function() {
          queryInterface.sequelize.query('DROP VIEW groups_active').then(function() {
                      done();
          });
        });
      });
    });
  }
};
