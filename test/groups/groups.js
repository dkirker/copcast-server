var request = require('supertest'),
  should = require('should'),
  proxyquire =  require('proxyquire'),
  auth = require('./../mocks/auth'),
  db = require('./../../lib/db'),
  users = proxyquire('./../../lib/users', { './../auth' : auth, './../db' : db }),
  http = require('http'),
  server = http.createServer(users),
  api = request(server);

describe('Groups Tests', function() {
  beforeEach(function(done){
    db.sequelize.sync({force: true}).then(function(err) {
      done();
    });
  });

  describe('List groups', function(){
    it('shows groups',function(done){

    });
    it('shows empty list',function(done){

    });
  });

  describe('Create groups', function(){
    it('create successfully',function(done){

    });
    it('fails with required fields blank',function(done){

    });
  });

  describe('Update groups', function(){
    it('update successfully',function(done){

    });
    it('fails with required fields blank',function(done){

    });
  });

  describe('Delete group', function(){
    it('delete successfully',function(done){

    });
  });
});
