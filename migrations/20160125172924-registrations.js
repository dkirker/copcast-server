'use strict';

module.exports = {
  up: function (queryInterface, Sequelize, done) {
    queryInterface.createTable(
      'registrations', {
        imei: {
          type: Sequelize.STRING(32),
          primaryKey: true
        },
        simid: {
          type: Sequelize.STRING(32),
          allowNull: false
        },
        public_key: {
          type: Sequelize.STRING(1024),
          allowNull: false
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false
        }

      }).then(function() {
        done();
      });
  },

  down: function (queryInterface, Sequelize, done) {
    queryInterface.dropTable('registrations').then(function () {
      done();
    })
  }
}
