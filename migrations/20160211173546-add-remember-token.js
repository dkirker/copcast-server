'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {

    queryInterface.addColumn(
      'users',
      'rememberToken',
      {
        type: Sequelize.STRING(20)
      }
    );

  },

  down: function (queryInterface, Sequelize) {
    /*
     Add reverting commands here.
     Return a promise to correctly handle asynchronicity.

     Example:
     return queryInterface.dropTable('users');
     */
    queryInterface.removeColumn(
      'users',
      'rememberToken'
    );
  }
};
