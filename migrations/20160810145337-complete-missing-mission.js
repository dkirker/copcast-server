'use strict';
var usageScript = require('../correctUsageReport');
module.exports = {
  up: function (queryInterface, Sequelize) {
    usageScript.updateHistoryRecording();
  },

  down: function (queryInterface, Sequelize) {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  }
};
