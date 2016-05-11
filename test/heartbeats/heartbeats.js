var request = require('supertest'),
  should = require('should'),
  proxyquire =  require('proxyquire'),
  auth = require('./../mocks/auth'),
  db = require('./../../lib/db'),
  users = proxyquire('./../../lib/users', { './../auth' : auth, './../db' : db }),
  http = require('http'),
  server = http.createServer(users),
  api = request(server);

describe('Heartbeats Tests', function() {
  beforeEach(function(done){
    db.sequelize.sync({force: true}).then(function(err) {
      done();
    });
  });

  describe('create heartbeat',function(){
    it('sends socket to same group',function(done){

    });

    it('creates battery state',function(done){

    });

    it('sends socket to different admin group',function(done){

    });

    it('do not send socket to different group non admin',function(done){

    });

  });

});
