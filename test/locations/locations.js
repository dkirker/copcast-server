var request = require('supertest'),
  should = require('should'),
  app = require('express')(),
  proxyquire = require('proxyquire'),
  auth = require('./../mocks/auth'),
  db = require('./../../lib/db'),
  rest = proxyquire('./../../lib/locations', {'./../auth': auth, './../db': db}),
  bodyParser = require('body-parser'),
  config = require('./../../lib/config'),
  factory = require('./../setup');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(rest);

auth.scope = 'client'; //set mock user scope

config.signatureVerification = false;

describe('Bulk location upload', function() {
  beforeEach(function (done) {
    db.sequelize.sync({force: true}).then(function (err) {
      factory.create('testUser', function (err, u) {
        if (err) {
          console.log(err);
          done();
        } else {
          auth.user = u;  //set mock user
          done();
        }
      });
    });
  });

  describe('',function(){
    it('will upload one item', function (done) {
      request(app).post('/locations/testuser')
        .send({"bulk": [{"lat":72.1, "lng": 42.1, "date": "2016-08-19T23:11:15.123Z"}]})
        .expect(201)
        .end(function (err, res) { should.not.exist(err); done(); });
    });
  });

  describe('',function(){
    it('will upload one fake array like', function (done) {
      request(app).post('/locations/testuser')
        .send({"bulk": {"length" : 10}})
        .expect(400)
        .end(function (err, res) { should.not.exist(err); done(); });
    });
  });

  describe('',function(){
    it('will upload one malicious json', function (done) {
      request(app).post('/locations/testuser')
        .send({"bulk": [{"provider": {"$iLike": "%"}}]})
        .expect(400)
        .end(function (err, res) { should.not.exist(err); done(); });
    });
  });
});
