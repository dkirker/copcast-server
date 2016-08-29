var request = require('supertest'),
  should = require('should'),
  app = require('express')(),
  proxyquire = require('proxyquire'),
  auth = require('./../mocks/auth'),
  db = require('./../../lib/db'),
  rest = proxyquire('./../../lib/histories', {'./../auth': auth, './../db': db}),
  bodyParser = require('body-parser'),
  config = require('./../../lib/config'),
  factory = require('./../setup');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(rest);

auth.scope = 'client'; //set mock user scope

describe('Bulk histories upload', function() {
  beforeEach(function (done) {
    config.signatureVerification = false;
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

  describe('Bulk uploads',function(){
    it('will upload one item', function (done) {
      request(app).post('/histories/testuser')
        .send({"bulk": [{"previousState":"PLAYING_VIDEO", "nextState": "LOGGED", "date": "2016-08-19T23:11:15.123Z", "extras": {"foo": "bar"}}]})
        .expect(201)
        .end(function (err, res) { should.not.exist(err); done(); });
    });

    it('will upload one fake array like', function (done) {
      request(app).post('/histories/testuser')
        .send({"bulk": {"length" : 10}})
        .expect(400)
        .end(function (err, res) { should.not.exist(err); done(); });
    });

    it('will upload one malicious json', function (done) {
      request(app).post('/histories/testuser')
        .send({"bulk": [{"previousState": {"$iLike": "%"}, "nextState": "LOGGED"}]})
        .expect(400)
        .end(function (err, res) { should.not.exist(err); done(); });
    });
  });

  describe('Individual uploads',function(){
    it('sends valid history request',function(done) {
      request(app).post('/histories')
        .send({"previousState":"PLAYING_VIDEO", "nextState": "LOGGED", "date": "2016-08-19T23:11:15.123Z", "extras": {"foo": "bar"}})
        .expect(201)
        .end(function (err, res) {
          should.not.exist(err);
          done();
        });
    });

    it('will upload one malicious json in previousState', function (done) {
      request(app).post('/histories')
        .send({"previousState": {"$iLike": "%"}, "nextState": "LOGGED"})
        .expect(400)
        .end(function (err, res) { should.not.exist(err); done(); });
    });

    it('will upload one malicious json in nextState', function (done) {
      request(app).post('/histories')
        .send({"nextStateState": {"$iLike": "%"}, "previousState": "PLAYING_VIDEO"})
        .expect(400)
        .end(function (err, res) { should.not.exist(err); done(); });
    });
  });
});