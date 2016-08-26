var request = require('supertest'),
  should = require('should'),
  app = require('express')(),
  proxyquire = require('proxyquire'),
  auth = require('./../mocks/auth'),
  db = require('./../../lib/db'),
  rest = proxyquire('./../../lib/heartbeats', {'./../auth': auth, './../db': db}),
  bodyParser = require('body-parser'),
  config = require('./../../lib/config'),
  factory = require('./../setup');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(rest);

auth.scope = 'client'; //set mock user scope

describe('MAC Signature Verification Tests', function() {
  beforeEach(function (done) {
    config.signatureVerification = true;
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

  describe('create heartbeat',function(){
    it('cannot json sql inject simid', function (done) {
      request(app).post('/heartbeats')
        .send({"mac": {"length": 5}, "imei":"foo","simid":{"$iLike": "%"}})
        .expect(403)
        .end(function (err, res) { should.not.exist(err); done(); });
    });

    it('cannot json sql inject imei', function (done) {
      request(app).post('/heartbeats')
        .send({"mac": {"length": 200}, "imei":{"$iLike": "1%"},"simid":"bar"})
        .set('Authorization', 'Bearer sdfdf')
        .expect(403)
        .end(function (err, res) { should.not.exist(err); done(); });
    });

    it('cannot json sql inject imei and simid', function (done) {
      request(app).post('/heartbeats')
        .send({"mac": {"length": 200}, "imei":{"$iLike": "1%"},"simid":{"$iLike": "%"}})
        .set('Authorization', 'Bearer sdfdf')
        .expect(403)
        .end(function (err, res) { should.not.exist(err); done(); });
    });

    it('cannot perform buffer memory exhaustion using fake arraylike', function (done) {
      request(app).post('/heartbeats')
        .send({"mac": {"length": 1000000000}, "imei":"990000862471854","simid":"8991101200003204510"})
        .set('Authorization', 'Bearer sdfdf')
        .expect(403)
        .end(function (err, res) { should.not.exist(err); done(); });
    });

    it('cannot perform buffer memory exhaustion using long string', function (done) {
      var mac = Buffer(1025);
      mac.fill('X');
      request(app).post('/heartbeats')
        .send({"mac": mac.toString(), "imei":"990000862471854","simid":"8991101200003204510"})
        .set('Authorization', 'Bearer sdfdf')
        .expect(403)
        .end(function (err, res) { should.not.exist(err); done(); });
    });
  });

});
