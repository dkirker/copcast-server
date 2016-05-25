'use strict';

module.exports = {
  up: function (queryInterface, Sequelize, done) {
    queryInterface.sequelize.query('UPDATE histories SET "nextState" = \'RECORDING\' WHERE "nextState" = \'RECORDING_ONLINE\' ' +
      'OR "nextState" = \'RECORDING_OFFLINE\'  ').then(function(){
      queryInterface.sequelize.query('UPDATE histories SET "previousState" = \'RECORDING\' WHERE "previousState" = \'RECORDING_ONLINE\' ' +
        'OR "previousState" = \'RECORDING_OFFLINE\'  ');
      done();
    })
  },

  down: function (queryInterface, Sequelize) {
  }
};
