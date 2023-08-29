'use strict';

module.exports = {
  down: function(migration, DataTypes, done) {
    return migration.sequelize.query('DROP VIEW users_active').then(
      migration.addColumn("users", "profilePicture", DataTypes.STRING)).then(
        migration.sequelize.query('CREATE VIEW users_active AS SELECT * FROM users WHERE "deletedAt" IS NULL'));

  },
  up: function(migration, DataTypes, done) {
    return migration.sequelize.query('DROP VIEW users_active').then(
      migration.removeColumn("users", "profilePicture", DataTypes.STRING)).then(
        migration.sequelize.query('CREATE VIEW users_active AS SELECT * FROM users WHERE "deletedAt" IS NULL'));
  }
};
