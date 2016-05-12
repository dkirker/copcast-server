var request = require('supertest'),
  should = require('should'),
  proxyquire = require('proxyquire'),
  auth = require('./../mocks/auth'),
  db = require('./../../lib/db'),
  groups = proxyquire('./../../lib/groups', {'./../auth': auth, './../db': db}),
  http = require('http'),
  server = http.createServer(groups),
  api = request(server),
  factory = require('./../setup');

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

  describe('List groups', function(){
    it('shows groups',function(done){
      api.get('/groups')
        .expect(200)
        .end(function(err, res) {
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
      api.post('/groups')
        .send(groupData)
        .expect(200)
        .end(function (err, res) {
         done()
        });
    });
    it('fails with required fields blank',function(done){
      api.post('/groups')
    .type('json')
        .send({})
        .expect(403)
        .end(function(err, res) {
            done();
        });
    });
  });

  describe('Update groups', function(){
    it('update successfully',function(done){
  
      var name = 'NEW NAME';
        api.post('/groups/'+groupAdmin.id)
          .send({name: name})
  .type('json')
        .expect(200)
        .end(function(err, res) {
          db.user.findById(group.id).then(function(g){
            should(g.name).equal(name);
            done();
          })
        });
    });
    it('fails with required fields blank',function(done){
  
      var name = 'NEW NAME';
      api.post('/groups/'+groupAdmin.id)
        .send({name: null})
  .type('json')
        .expect(403)

        .end(function(err, res) {
          db.user.findById(group.id).then(function(g){
            should(g.name).equal(name);
            done();
          })
        });
    });
  });
  
  describe('Delete group', function(){
    var groupNoUser = null;
    beforeEach(function(done){
      factory.create('groupNoUser', function(err, g){
        groupNoUser = g;
        done();
      });
    });
    it('delete successfully',function(done){
      api.delete('/groups/'+groupNoUser.id)
        .expect(200)
        .end(function(err, res) {
          db.user.findById(groupNoUser.id).then(function(g){
            should(g).be.null();
            done();
          })
        });
    });
  });
});
