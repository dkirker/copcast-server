'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('users', 'gcmRegistration');
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.createColumn('users', 'gcmRegistration', Sequelize.STRING(1024));
  }
};
