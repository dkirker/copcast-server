'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {

    queryInterface.addColumn(
      'users',
      'rememberToken',
      {
        type: Sequelize.STRING
      }
    );

  },

  down: function (queryInterface, Sequelize) {
    queryInterface.removeColumn(
      'users',
      'rememberToken'
    );
  }
};
