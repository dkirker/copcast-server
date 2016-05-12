var request = require('supertest'),
  should = require('should'),
  app = require('express')(),
  proxyquire = require('proxyquire'),
  auth = require('./../mocks/auth'),
  db = require('./../../lib/db'),
  rest = proxyquire('./../../lib/logreports', {'./../auth': auth, './../db': db}),
  bodyParser = require('body-parser'),
  factory = require('./../setup');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(rest);


describe('Groups Tests', function() {
  beforeEach(function(done){
    db.sequelize.sync({force: true}).then(function(err) {
      done();
    });
  });

  it('shows all history',function(done){

  });

  it('filter by group',function(done){

  });

  it('filter by user',function(done){

  });

  it('filter by date',function(done){

  });
});
