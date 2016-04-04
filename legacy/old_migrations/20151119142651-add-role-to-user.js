'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    /*
      Add altering commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.createTable('users', { id: Sequelize.INTEGER });
    */
    queryInterface.addColumn(
      'users',
      'role',
      {
        type: Sequelize.STRING(20)
      }
    ).then(function () {

      queryInterface.sequelize.query("update users set role = 'mobile' where \"isAdmin\" <> true");
      queryInterface.sequelize.query("update users set role = 'admin_3' where \"isAdmin\" = true");
    });;

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
      'role'
    );
  }
};
