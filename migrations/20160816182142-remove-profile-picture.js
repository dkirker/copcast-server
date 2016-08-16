'use strict';

module.exports = {
  down: function(migration, DataTypes, done) {
    migration.sequelize.query('DROP VIEW users_active').then(function() {
      migration.addColumn("users", "profilePicture", DataTypes.STRING).then(function() {
        migration.sequelize.query('CREATE VIEW users_active AS SELECT * FROM users WHERE "deletedAt" IS NULL');
        done();
      });
    });

  },
  up: function(migration, DataTypes, done) {
    migration.sequelize.query('DROP VIEW users_active').then(function() {
      migration.removeColumn("users", "profilePicture", DataTypes.STRING).then(function() {
        migration.sequelize.query('CREATE VIEW users_active AS SELECT * FROM users WHERE "deletedAt" IS NULL');
        done();
      });
    });
  }
};
