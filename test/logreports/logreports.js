var request = require('supertest'),
  should = require('should'),
  app = require('express')(),
  moment = require('moment'),
  proxyquire = require('proxyquire'),
  auth = require('./../mocks/auth'),
  db = require('./../../lib/db'),
  rest = proxyquire('./../../lib/logreports', {'./../auth': auth, './../db': db}),
  bodyParser = require('body-parser'),
  factory = require('./../setup');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(rest);


describe('Audit Report Tests', function () {
  var group, user;
  beforeEach(function (done) {
    db.sequelize.sync({force: true}).then(function (result) {
      // factory.create('groupAdmin', function (err, g) {
      //   if (err) {
      //     console.error(err);
      //     return done(err);
      //   }

        factory.create('historyStreaming', function (err, history) {
          if (err) {
            console.error(err);
            return done(err);
          }
          history.getUser().then(function (u) {

            auth.user = user = u;
            auth.scope = 'client';
            u.getGroup().then(function(g){
              group = g;
            });
            done();
          }).catch(function (err) {
            console.error(err);
            done(err);
          });
        // });
      });

    });
  });
  describe('tests without date', function () {
    it('shows all history', function (done) {
      request(app).get('/logreports')
        .expect(200)
        .end(function (err, res) {
          should.not.exist(err);
          res.body.rows.length.should.equal(1);
          done();
        });
    });

    it('filter by group with no results', function (done) {
      request(app).get('/logreports')
        .query({"group": 123333})
        .expect(200)
        .end(function (err, res) {
          should.not.exist(err);
          res.body.rows.length.should.equal(0);
          done();
        });
    });
    it('filter by group with results', function (done) {
      request(app).get('/logreports')
        .query({"group": group.id})
        .expect(200)
        .end(function (err, res) {
          should.not.exist(err);
          res.body.rows.length.should.equal(1);
          done();
        });
    });

    it('filter by user with no results', function (done) {
      request(app).get('/logreports')
        .query({"user": 948379438729874219})
        .expect(200)
        .end(function (err, res) {
          should.not.exist(err);
          res.body.rows.length.should.equal(0);
          done();
        });
    });

    it('filter by user with results', function (done) {
      request(app).get('/logreports')
        .query({"user": user.id})
        .expect(200)
        .end(function (err, res) {
          should.not.exist(err);
          res.body.rows.length.should.equal(1);
          done();
        });
    });
  });


  describe('tests with date', function () {
    var initialDate, endDate;
    beforeEach(function () {
      initialDate = moment.utc().subtract(8, 'd');
      endDate = moment.utc().subtract(5, 'd');
    })
    it('shows all history', function (done) {
      request(app)
        .get('/logreports/' + initialDate.format('YYYY-MM-DD') + '/' + endDate.format('YYYY-MM-DD'))
        .expect(200)
        .end(function (err, res) {
          should.not.exist(err);
          res.body.rows.length.should.equal(1);
          done();
        });
    });
    it('invalid period', function (done) {
      request(app)
        .get('/logreports/' + endDate.format('YYYY-MM-DD') + '/' + initialDate.format('YYYY-MM-DD'))
        .expect(400)
        .end(function (err, res) {
          should.not.exist(err);
          done();
        });
    });
    it('invalid dates', function (done) {
      request(app)
        .get('/logreports/9999-99-99/9999-99-99')
        .expect(400)
        .end(function (err, res) {
          should.not.exist(err);
          done();
        });
    });

    it('filter by group with no results', function (done) {
      request(app).get('/logreports/' + initialDate.format('YYYY-MM-DD') + '/' + endDate.format('YYYY-MM-DD'))
        .query({"group": 123333})
        .expect(200)
        .end(function (err, res) {
          should.not.exist(err);
          res.body.rows.length.should.equal(0);
          done();
        });
    });
    it('filter by group with results', function (done) {
      request(app).get('/logreports/' + initialDate.format('YYYY-MM-DD') + '/' + endDate.format('YYYY-MM-DD'))
        .query({"group": group.id})
        .expect(200)
        .end(function (err, res) {
          should.not.exist(err);
          res.body.rows.length.should.equal(1);
          done();
        });
    });

    it('filter by user with no results', function (done) {
      request(app).get('/logreports/' + initialDate.format('YYYY-MM-DD') + '/' + endDate.format('YYYY-MM-DD'))
        .query({"user": 948379438729874219})
        .expect(200)
        .end(function (err, res) {
          should.not.exist(err);
          res.body.rows.length.should.equal(0);
          done();
        });
    });

    it('filter by user with results', function (done) {
      request(app).get('/logreports/' + initialDate.format('YYYY-MM-DD') + '/' + endDate.format('YYYY-MM-DD'))
        .query({"user": user.id})
        .expect(200)
        .end(function (err, res) {
          should.not.exist(err);
          res.body.rows.length.should.equal(1);
          done();
        });
    });
  });
});
