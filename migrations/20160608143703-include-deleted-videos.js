'use strict';

module.exports = {
  up: function (queryInterface, Sequelize, done) {
    return queryInterface.addColumn('videos','isDeleted',  Sequelize.BOOLEAN, {default: false} ).then(
      queryInterface.addColumn('videos','hasIncident', Sequelize.BOOLEAN, {default: false} ));
  },

  down: function (queryInterface, Sequelize, done) {
    return queryInterface.removeColumn('videos','isDeleted').then(
      queryInterface.removeColumn('videos','hasIncident'));
  }
};
