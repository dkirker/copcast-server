var request = require('supertest'),
  should = require('should'),
  app = require('express')(),
  proxyquire = require('proxyquire'),
  auth = require('./../mocks/auth'),
  db = require('./../../lib/db'),
  rest = proxyquire('./../../lib/registrations', {'./../auth': auth, './../db': db}),
  bodyParser = require('body-parser'),
  config = require('./../../lib/config'),
  factory = require('./../setup');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(rest);

auth.scope = 'client'; //set mock user scope

describe('Registrations', function() {
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

  describe('Performs registration',function(){
    it('sends valid registration request',function(done) {
      request(app).post('/registration')
        .send({username: 'testuser', password: 'test1234', imei: '1213233323', simid: '8998977', public_key: '8293893'})
        .expect(201)
        .end(function (err, res) {
          should.not.exist(err);
          done();
        });
    });

    it('sends valid registration request with bad username',function(done) {
      request(app).post('/registration')
        .send({username: 'foo', password: 'test1234', imei: '1213233323', simid: '8998977', public_key: '8293893'})
        .expect(401)
        .end(function (err, res) {
          should.not.exist(err);
          done();
        });
    });

    it('sends valid registration request with bad password',function(done) {
      request(app).post('/registration')
        .send({username: 'testuser', password: 'foo', imei: '1213233323', simid: '8998977', public_key: '8293893'})
        .expect(401)
        .end(function (err, res) {
          should.not.exist(err);
          done();
        });
    });

    it('will upload one malicious json in username', function (done) {
      request(app).post('/registration')
        .send({username: {"$iLike": "%"}, password: 'test1234', imei: '1213233323', simid: '8998977', public_key: '8293893'})
        .expect(400)
        .end(function (err, res) { should.not.exist(err); done(); });
    });

    it('will upload one malicious json in password',function(done) {
      request(app).post('/registration')
        .send({username: 'testuser', password: {"$iLike": "%"}, imei: '1213233323', simid: '8998977', public_key: '8293893'})
        .expect(400)
        .end(function (err, res) {
          should.not.exist(err);
          done();
        });
    });

    it('will upload one malicious json in imei',function(done) {
      request(app).post('/registration')
        .send({username: 'testuser', password: 'test1234', imei: {"$iLike": "%"}, simid: '8998977', public_key: '8293893'})
        .expect(400)
        .end(function (err, res) {
          should.not.exist(err);
          done();
        });
    });

    it('will upload one malicious json in simid',function(done) {
      request(app).post('/registration')
        .send({username: 'testuser', password: 'test1234', imei: '1213233323', simid: {"$iLike": "%"}, public_key: '8293893'})
        .expect(400)
        .end(function (err, res) {
          should.not.exist(err);
          done();
        });
    });

    it('will upload one malicious json in public_key',function(done) {
      request(app).post('/registration')
        .send({username: 'testuser', password: 'test1234', imei: '1213233323', simid: '8998977', public_key: {"$iLike": "%"}})
        .expect(400)
        .end(function (err, res) {
          should.not.exist(err);
          done();
        });
    });
  });
});
