'use strict';
var copcast_db_user = require('../lib/db').sequelize.config.username;

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
        },
        username: {
          type: Sequelize.STRING,
          allowNull: false
        },
        ipaddress: {
          type: Sequelize.STRING(16),
          allowNull: false
        }

      }).then(function() {
        queryInterface.sequelize.query("GRANT SELECT,INSERT,UPDATE ON registrations TO "+copcast_db_user).then(function() {
          done();
          return null;
        });
      });
    return null;
  },

  down: function (queryInterface, Sequelize, done) {
    done(); return null;
    queryInterface.dropTable('registrations').then(function () {
      queryInterface.sequelize.query("REVOKE SELECT,INSERT,UPDATE ON registrations FROM "+copcast_db_user).then(function() {
        done();
        return null;
      });
    });
    return null;
  }
}
