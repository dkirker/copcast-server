'use strict';

module.exports = {
  up: function (queryInterface, Sequelize, done) {
    queryInterface.createTable(
      'registrations_history', {
        imei: {
          type: Sequelize.STRING(32),
          allowNull: false
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

        queryInterface.sequelize.query(
          'CREATE OR REPLACE FUNCTION archive_registration() RETURNS trigger AS $archive_registration$\n' +
          'BEGIN\n' +
          'INSERT INTO registrations_history SELECT NEW.*;\n' +
          'RETURN NULL;\n' +
          'END;\n' +
          '$archive_registration$ LANGUAGE plpgsql;').then(function () {
            queryInterface.sequelize.query(
              'CREATE TRIGGER registration_trigger\n' +
              'AFTER INSERT OR UPDATE ON registrations\n' +
              'FOR EACH ROW EXECUTE PROCEDURE archive_registration();'
            ).then(function() {
                done();
                return null;
              });
            return null;
          });
        return null;
      }
    );
  },

  down: function (queryInterface, Sequelize, done) {
    queryInterface.dropTable('registrations_history').then(function () {
      queryInterface.sequelize.query('DROP TRIGGER registration_trigger ON registrations;').then(function() {
        queryInterface.sequelize.query('DROP function archive_registration();').then(function() {
          done();
          return null;
        });
        return null;
      });
      return null;
    });
  }
}
