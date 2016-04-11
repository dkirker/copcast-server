var request = require('supertest'),
    should = require('should'),
    proxyquire =  require('proxyquire'),
    auth = require('./../mocks/auth'),
    db = require('./../../lib/db'),
    users = proxyquire('./../../lib/users', { './../auth' : auth, './../db' : db }),
    http = require('http'),
    server = http.createServer(users),
    api = request(server);

describe('Users Me Endpoint Tests', function() {
  beforeEach(function(done){
    db.sequelize.sync({force: true}).then(function(err) {
      done();
    });
  });

  describe('When user is authenticated', function() {
    var user = { id : 1, username : "test" };

    beforeEach(function() {
      auth.user = user;
      auth.scope = 'client';
    });

    it('should return a 401 error if not logged', function(done){
      auth.user = null;
      auth.scope = null;

      api.get('/users/me')
        .expect(401)
        .end(function(err, res) {
          should.not.exist(err);
          done();
        });
    });

     it('should return 200 with json', function(done) {
      api.get('/users/me')
        .expect(200)
        .end(function(err, res) {
          should.not.exist(err);
          res.body.username.should.equal(user.username);
          res.body.id.should.equal(user.id);
          done();
        });
    });
  });

  describe('Users online Endpoint Test', function(){
    var user = { id : 1, username : "test", role: 'admin_1' };

    beforeEach(function() {
      auth.user = user;
      auth.scope = 'client';
    });

    it('should return a 401 error if not logged', function(done){
      auth.user = null;
      auth.scope = null;

      api.get('/users/online')
        .expect(401)
        .end(function(err, res) {
          should.not.exist(err);
          done();
        });
    });


    it('should return no users', function(done){

      api.get('/users/online')
        .expect(200)
        .end(function(err, res) {
          should.not.exist(err);
          res.body.length.should.equal(0);
          done();
        });
    });
  });
});
