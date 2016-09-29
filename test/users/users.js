var request = require('supertest'),
  should = require('should'),
  app = require('express')(),
  proxyquire = require('proxyquire'),
  auth = require('./../mocks/auth'),
  db = require('./../../lib/db'),
  users = proxyquire('./../../lib/users', {'./../auth': auth, './../db': db}),
  bodyParser = require('body-parser'),
  factory = require('./../setup');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(users);

describe('Users Tests', function() {
  beforeEach(function(done){
    db.sequelize.sync({force: true}).then(function(err) {
      factory.create('testUser', function(err, u){
        auth.user = u;
        auth.scope = 'client';
        done();
      })

    });
  });

  describe('When user is authenticated', function() {

    it('should return a 401 error if not logged', function(done){
      auth.user = null;
      auth.scope = null;

      request(app).get('/users/me')
        .expect(401)
        .end(function(err, res) {
          should.not.exist(err);
          done();
        });
    });

    it('should return 200 with json', function(done) {
      request(app).get('/users/me')
        .expect(200)
        .end(function(err, res) {
          should.not.exist(err);
          res.body.username.should.equal(auth.user.username);
          res.body.id.should.equal(auth.user.id);
          done();
        });
    });
  });

  describe('Users online Endpoint Test', function(){

    it('should return a 401 error if not logged', function(done){
      auth.user = null;
      auth.scope = null;

      request(app).get('/users/online')
        .expect(401)
        .end(function(err, res) {
          should.not.exist(err);
          done();
        });
    });


    it('should return no users', function(done){

      request(app).get('/users/online')
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
      newUser = {
        username: 'username',
        password: 'mypassword',
        email: 'user@email.com',
        name: 'Name',
        language: 'en'
      };

    beforeEach(function(done) {
      db.group.findOne().then(function(g){
        group = g;
        newUser.groupId = group.id;
        done();
      });

    });

    it('should return a 401 error if not logged', function(done){
      auth.user = null;
      auth.scope = null;

      request(app).post('/users')
        .send(newUser)
        .expect(401)
        .end(function(err, res) {
          should.not.exist(err);
          done();
        });
    });


    it('should create one user without role', function(done){
      request(app).post('/users')
        .send(newUser)
        .expect(202)
        .end(function(err, res) {
          should.not.exist(err);
          db.user.findOne({username: newUser.username}).then(function(user){
            should.exist(user);
            done();
          })
        });
    });

    it('should create one user with role', function(done){
      var userWithRole = JSON.parse(JSON.stringify(newUser));
      userWithRole.role = 'admin_3';
      userWithRole.isAdmin = true;
      request(app).post('/users')
        .send(userWithRole)
        .expect(202)
        .end(function(err, res) {
          should.not.exist(err);
          db.user.findOne({username: newUser.username}).then(function(user){
            should.exist(user);
            done();
          })
        });
    });

    it('should fail to create one user with bad username', function(done){
      var brokenUser = JSON.parse(JSON.stringify(newUser));
      brokenUser.username = {"$iLike": "%"};
      request(app).post('/users')
        .send(brokenUser)
        .expect(400)
        .end(function(err, res) {
          should.not.exist(err);
          db.user.findOne({username: newUser.username}).then(function(user){
            should.exist(user);
            done();
          })
        });
    });

    it('should fail to create one user with bad password', function(done){
      var brokenUser = JSON.parse(JSON.stringify(newUser));
      brokenUser.password = {"$iLike": "%"};
      request(app).post('/users')
        .send(brokenUser)
        .expect(400)
        .end(function(err, res) {
          should.not.exist(err);
          db.user.findOne({username: newUser.username}).then(function(user){
            should.exist(user);
            done();
          })
        });
    });

    it('should fail to create one user with bad email', function(done){
      var brokenUser = JSON.parse(JSON.stringify(newUser));
      brokenUser.email = {"$iLike": "%"};
      request(app).post('/users')
        .send(brokenUser)
        .expect(400)
        .end(function(err, res) {
          should.not.exist(err);
          db.user.findOne({username: newUser.username}).then(function(user){
            should.exist(user);
            done();
          })
        });
    });

    it('should fail to create one user with bad name', function(done){
      var brokenUser = JSON.parse(JSON.stringify(newUser));
      brokenUser.name = {"$iLike": "%"};
      request(app).post('/users')
        .send(brokenUser)
        .expect(400)
        .end(function(err, res) {
          should.not.exist(err);
          db.user.findOne({username: newUser.username}).then(function(user){
            should.exist(user);
            done();
          })
        });
    });

    it('should fail to create one user with bad role', function(done){
      var brokenUser = JSON.parse(JSON.stringify(newUser));
      brokenUser.role = {"$iLike": "%"};
      request(app).post('/users')
        .send(brokenUser)
        .expect(400)
        .end(function(err, res) {
          should.not.exist(err);
          db.user.findOne({username: newUser.username}).then(function(user){
            should.exist(user);
            done();
          })
        });
    });

    it('should fail to create one user with bad isAdmin', function(done){
      var brokenUser = JSON.parse(JSON.stringify(newUser));
      brokenUser.isAdmin = {"$iLike": "%"};
      request(app).post('/users')
        .send(brokenUser)
        .expect(400)
        .end(function(err, res) {
          should.not.exist(err);
          db.user.findOne({username: newUser.username}).then(function(user){
            should.exist(user);
            done();
          })
        });
    });

    it('should fail to create one user with bad language', function(done){
      var brokenUser = JSON.parse(JSON.stringify(newUser));
      brokenUser.language = {"$iLike": "%"};
      request(app).post('/users')
        .send(brokenUser)
        .expect(400)
        .end(function(err, res) {
          should.not.exist(err);
          db.user.findOne({username: newUser.username}).then(function(user){
            should.exist(user);
            done();
          })
        });
    });
  });
});
