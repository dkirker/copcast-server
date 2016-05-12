var request = require('supertest'),
  should = require('should'),
  app = require('express')(),
  proxyquire = require('proxyquire'),
  auth = require('./../mocks/auth'),
  db = require('./../../lib/db'),
  groups = proxyquire('./../../lib/groups', {'./../auth': auth, './../db': db})
  , bodyParser = require('body-parser'), factory = require('./../setup');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(groups);

describe('Groups Tests', function () {
  var groupAdmin = null;
  beforeEach(function (done) {

    db.sequelize.sync({force: true}).then(function (err) {
      factory.create('testUser', function (err, user) {
        auth.user = user;
        auth.scope = 'client';
        user.getGroup().then(function (group) {
          groupAdmin = group;
          done();
        })

      });
    });
  });

  describe('List groups', function () {
    it('shows groups', function (done) {
      request(app).get('/groups')
        .expect(200)
        .end(function (err, res) {
          should(err).be.null();
          should(res.body.length).equal(1);
          done();
        });
    });
  });

  describe('Create groups', function () {
    it('create successfully', function (done) {
      var groupData = {
        name: 'Test group'
      };
      request(app).post('/groups')
        .send(groupData)
        .type('json')
        .expect(200)
        .end(function (err, res) {
          done()
        });
    });
    it('fails with required fields blank', function (done) {
      request(app).post('/groups')
        .type('form')
        .send({})
        .expect(403)
        .end(function (err, res) {
          done();
        });
    });
  });

  describe('Update groups', function () {
    it('update successfully', function (done) {

      var name = 'NEW NAME';
      request(app).post('/groups/' + groupAdmin.id)
        .send({name: name})
        .type('form')
        .expect(200)
        .end(function (err, res) {
          db.group.findById(groupAdmin.id).then(function (g) {
            should(g.name).equal(name);
            done();
          })
        });
    });
    it('fails with required fields blank', function (done) {

      request(app).post('/groups/' + groupAdmin.id)
        .send({name: null})
        .type('form')
        .expect(403)

        .end(function (err, res) {
            done();
        });
    });
  });

  describe('Delete group', function () {
    var groupNoUser = null;
    beforeEach(function (done) {
      factory.create('groupNoUser', function (err, g) {
        groupNoUser = g;
        done();
      });
    });
    it('delete successfully', function (done) {
      request(groups).delete('/groups/' + groupNoUser.id)
        .expect(200)
        .end(function (err, res) {
          db.group.findById(groupNoUser.id).then(function (g) {
            should(g).be.null();
            done();
          })
        });
    });
  });
});
