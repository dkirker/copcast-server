var request = require('supertest'),
  should = require('should'),
  app = require('express')(),
  proxyquire = require('proxyquire'),
  db = require('./../../lib/db'),
  auth = proxyquire('./../../lib/auth', {'./../db': db}),
  bodyParser = require('body-parser'),
  factory = require('./../setup');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.post('/token', auth.tokenEndpoint);

describe('Users Tests', function() {
  beforeEach(function(done){
    db.sequelize.sync({force: true}).then(function(err) {
      factory.create('testUser', function(err, u){
        done();
      })

    });
  });

  describe("User's authentication", function(){
    it('logs in successfully', function(done){
      request(app).post('/token')
        .send({username: 'testuser', password: 'test1234', scope: 'client'})
        .expect(200)
        .end(function(err, res) {
          should.not.exist(err);
          done();
        });
    });
    it('wrong password', function(done){
      request(app).post('/token')
        .send({username: 'testuser', password: 'FSAODIJASOIDJAO', scope: 'client'})
        .expect(401)
        .end(function(err, res) {
          should.not.exist(err);
          done();
        });
    });
    it('uppercase name', function(done){
      request(app).post('/token')
        .send({username: 'TESTuser', password: 'test1234', scope: 'client'})
        .expect(200)
        .end(function(err, res) {
          should.not.exist(err);
          done();
        });
    });
  })
});
