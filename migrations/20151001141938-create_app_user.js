'use strict';
var copcast_db_user = require('../lib/db').sequelize.config.username;
var copcast_db_pass = require('../lib/db').sequelize.config.password;

module.exports = {
  up: function (queryInterface, Sequelize, done) {
    queryInterface.sequelize.query("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT,INSERT ON TABLES TO "+copcast_db_user).then(function() {
      queryInterface.sequelize.query("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE,SELECT ON SEQUENCES TO "+copcast_db_user).then(function() {
        queryInterface.sequelize.query("GRANT SELECT,INSERT,UPDATE ON ALL TABLES IN SCHEMA public TO "+copcast_db_user).then(function() {
          queryInterface.sequelize.query("GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO "+copcast_db_user).then(function() {
            queryInterface.sequelize.query("REVOKE UPDATE ON histories FROM "+copcast_db_user).then(function() {
              queryInterface.sequelize.query("REVOKE UPDATE ON locations FROM "+copcast_db_user).then(function() {
                queryInterface.sequelize.query("REVOKE UPDATE ON videos FROM "+copcast_db_user).then(function() {
                  queryInterface.removeColumn("histories", "createdAt").then(function() {
                    queryInterface.removeColumn("histories", "updatedAt").then(function() {
                     done();
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  },

  down: function (queryInterface, Sequelize, done) {

  queryInterface.sequelize.query("ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE SELECT,INSERT ON TABLES FROM "+copcast_db_user).then(function() {
    queryInterface.sequelize.query("ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE USAGE,SELECT ON SEQUENCES FROM "+copcast_db_user).then(function() {
      queryInterface.sequelize.query("REVOKE SELECT,INSERT,UPDATE ON ALL TABLES IN SCHEMA public FROM "+copcast_db_user).then(function() {
        queryInterface.sequelize.query("REVOKE USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public FROM "+copcast_db_user).then(function() {
            queryInterface.addColumn("histories", "createdAt", Sequelize.DATE).then(function() {
              queryInterface.addColumn("histories", "updatedAt", Sequelize.DATE).then(function() {
                queryInterface.sequelize.query('UPDATE histories SET "createdAt" = now(), "updatedAt" = now()').then(function() {
                  queryInterface.sequelize.query('ALTER TABLE histories ALTER COLUMN "createdAt" SET NOT NULL').then(function() {
                    queryInterface.sequelize.query('ALTER TABLE histories ALTER COLUMN "updatedAt" SET NOT NULL').then(function() {
                      done();
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  }
};
