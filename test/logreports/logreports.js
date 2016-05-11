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

  it('shows all history',function(done){

  });

  it('filter by group',function(done){

  });

  it('filter by user',function(done){

  });

  it('filter by date',function(done){

  });
});
