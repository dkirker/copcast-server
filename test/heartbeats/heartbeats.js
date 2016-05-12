var request = require('supertest'),
  should = require('should'),
  app = require('express')(),
  proxyquire = require('proxyquire'),
  auth = require('./../mocks/auth'),
  db = require('./../../lib/db'),
  rest = proxyquire('./../../lib/heartbeats', {'./../auth': auth, './../db': db}),
  bodyParser = require('body-parser'), 
  factory = require('./../setup');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(rest);

describe('Heartbeats Tests', function() {
  beforeEach(function(done){
    db.sequelize.sync({force: true}).then(function(err) {
      done();
    });
  });

  describe('create heartbeat',function(){
    it('sends socket to same group',function(done){

    });

    it('creates battery state',function(done){

    });

    it('sends socket to different admin group',function(done){

    });

    it('do not send socket to different group non admin',function(done){

    });

  });

});
