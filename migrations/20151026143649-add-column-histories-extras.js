'use strict';

module.exports = {
  up: function (queryInterface, DataTypes, done) {
    queryInterface.addColumn("histories", "extras", DataTypes.TEXT).then(function() {
      done();
    });
  },

  down: function (queryInterface, DataTypes, done) {
    queryInterface.removeColumn("histories", "extras").then(function() {
      done();
    });
  }
};
