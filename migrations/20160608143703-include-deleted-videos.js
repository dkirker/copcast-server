'use strict';

module.exports = {
  up: function (queryInterface, Sequelize, done) {
    queryInterface.addColumn('videos','isDeleted',  Sequelize.BOOLEAN, {default: false} ).then(function(){
      queryInterface.addColumn('videos','hasIncident', Sequelize.BOOLEAN, {default: false} ).then(function(){
        done()
      });
    });
  },

  down: function (queryInterface, Sequelize, done) {
    queryInterface.removeColumn('videos','isDeleted').then(function(){
      queryInterface.removeColumn('videos','hasIncident').then(function() {
        done();
      });
    });
  }
};
