var request = require('supertest'),
    should = require('should'),
    proxyquire =  require('proxyquire'),
    auth = require('./../mocks/auth'),
    db = require('./../../lib/db'),
    users = proxyquire('./../../lib/users', { './../auth' : auth, './../db' : db }),
    http = require('http'),
    server = http.createServer(users),
    api = request(server),
    factory = require('./../setup');

describe('Users Tests', function() {
  beforeEach(function(done){
    db.sequelize.sync({force: true}).then(function(err) {
      factory.create('testUser', function(err, post){
        done();
      })

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

  describe('User creation', function(){
    var group = null,
      user = { id : 1, username : "test", role: 'admin_1' },
      newUser = {
        username: 'username',
        email: 'user@email.com',
        name: 'Name',
        role: 'admin_3',
        isAdmin: true,
        language: 'en'
      };

    beforeEach(function(done) {
      auth.user = user;
      auth.scope = 'client';

      db.group.findOne().then(function(g){
        group = g;
        newUser.groupId = group.id;
        done();
      });

    });

    it('should return a 401 error if not logged', function(done){
      auth.user = null;
      auth.scope = null;

      api.post('/users')
        .send(newUser)
        .expect(401)
        .end(function(err, res) {
          done();
        });
    });


    it('should create one user', function(done){

      api.post('/users')
        .send(newUser)
        .expect(200)
        .end(function(err, res) {
          db.user.findOne({username: newUser.username}).then(function(user){
            should.exist(user);
            done();
          })
        });
    });
  });
});
