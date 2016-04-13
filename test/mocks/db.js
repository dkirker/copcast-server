"use strict"
var Promise = require('promise')
var db = {};

db.groups = {
  findById: function(id){
    return new Promise(function(fulfill, reject){
      fulfill({id: 1, name: 'Group Admin', isAdmin: false})
    })
  }
}

db.user = {findAll: function(query) {
    return new Promise(function(fulfill, reject){
      fulfill([])
    })
  }
}
module.exports = db;
