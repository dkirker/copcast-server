'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.addColumn(
      'users',
      'isEnabled',
      {
        type: Sequelize.BOOLEAN,
        defaultValue: true

      }
    ).then(function () {
      queryInterface.sequelize.query("update users set 'isEnabled' = true ");
    });;

  },

  down: function (queryInterface, Sequelize) {
    queryInterface.removeColumn(
      'users',
      'isEnabled'
    );
  }
};
