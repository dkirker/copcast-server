var request = require('supertest'),
  should = require('should'),
  app = require('express')(),
  proxyquire = require('proxyquire'),
  auth = require('./../mocks/auth'),
  db = require('./../../lib/db'),
  rest = proxyquire('./../../lib/incidents', {'./../auth': auth, './../db': db}),
  bodyParser = require('body-parser'),
  config = require('./../../lib/config'),
  factory = require('./../setup');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(rest);

auth.scope = 'client'; //set mock user scope
app.set('sockets', {emit : function (a, b) {}}); //mock sockets

describe('Bulk incidents upload', function() {
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
      request(app).post('/incidents/testuser')
        .send({"bulk": [{"date": "2016-08-19T23:11:15.123Z", "lat": 82, "lng": 42}]})
        .expect(201)
        .end(function (err, res) { should.not.exist(err); done(); });
    });

    it('will upload one fake array like', function (done) {
      request(app).post('/incidents/testuser')
        .send({"bulk": {"length" : 10}})
        .expect(400)
        .end(function (err, res) { should.not.exist(err); done(); });
    });

    it('will upload one malicious json', function (done) {
      request(app).post('/incidents/testuser')
        .send({"bulk": [{"lat": {"$iLike": "%"}, "lng": 42, "date": "2016-08-19T23:11:15.123Z"}]})
        .expect(400)
        .end(function (err, res) { should.not.exist(err); done(); });
    });
  });

  describe('Individual uploads',function(){
    it('sends valid incident request',function(done) {
      request(app).post('/incidents')
        .send({"date": "2016-08-19T23:11:15.123Z", "lat": 82, "lng": 42})
        .expect(201)
        .end(function (err, res) {
          should.not.exist(err);
          done();
        });
    });

    it('will upload one malicious json in lat', function (done) {
      request(app).post('/incidents')
        .send({"lat": {"$iLike": "%"}, "lng": 42, "date": "2016-08-19T23:11:15.123Z"})
        .expect(400)
        .end(function (err, res) { should.not.exist(err); done(); });
    });

    it('will upload one malicious json in lng', function (done) {
      request(app).post('/incidents')
        .send({"lng": {"$iLike": "%"}, "lat": 42, "date": "2016-08-19T23:11:15.123Z"})
        .expect(400)
        .end(function (err, res) { should.not.exist(err); done(); });
    });

    it('will upload one malicious json in lng', function (done) {
      request(app).post('/incidents')
        .send({"date": {"$iLike": "%"}, "lat": 82, "lng": 42})
        .expect(400)
        .end(function (err, res) { should.not.exist(err); done(); });
    });
  });
});