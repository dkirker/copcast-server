'use strict';

module.exports = {
  up: function (queryInterface, Sequelize, done) {
    queryInterface.sequelize.query('DROP VIEW users_active').then(function() {
      queryInterface.removeColumn('users', 'gcmRegistration').then(function(){
        queryInterface.sequelize.query('CREATE VIEW users_active AS SELECT * FROM users WHERE "deletedAt" IS NULL');
        done();
      });
    });
  },

  down: function (queryInterface, Sequelize, done) {

    queryInterface.sequelize.query('DROP VIEW users_active').then(function() {
      queryInterface.addColumn('users', 'gcmRegistration', Sequelize.STRING(1024)).then(function(){
        queryInterface.sequelize.query('CREATE VIEW users_active AS SELECT * FROM users WHERE "deletedAt" IS NULL');
        done();
      });
    });
  }
};
