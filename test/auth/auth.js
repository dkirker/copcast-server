/*global
 describe,
 beforeEach,
 it,
 request */
var request = require('supertest'),
  should = require('should'),
  app = require('express')(),
  proxyquire = require('proxyquire'),
  db = require('./../../lib/db'),
  auth = proxyquire('./../../lib/auth', {'./../db': db}),
  bodyParser = require('body-parser'),
  factory = require('./../setup');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.post('/token', auth.tokenEndpoint);

describe('Users Tests', function () {
  'use strict';
  beforeEach(function (done) {
    db.sequelize.sync({force: true}).then(function (err) {
      factory.create('testUser', function (err, u) {
        done();
      });
    });
  });

  describe("User's authentication", function () {
    it('logs in successfully', function (done) {
      request(app).post('/token')
        .send({username: 'testuser', password: 'test1234', scope: 'client'})
        .expect(200)
        .end(function (err, res) {
          should.not.exist(err);
          done();
        });
    });
    it('wrong password', function (done) {
      request(app).post('/token')
        .send({username: 'testuser', password: 'FSAODIJASOIDJAO', scope: 'client'})
        .expect(401)
        .end(function(err, res) {
          should.not.exist(err);
          done();
        });
    });
    it('uppercase name', function (done) {
      request(app).post('/token')
        .send({username: 'TESTuser', password: 'test1234', scope: 'client'})
        .expect(200)
        .end(function (err, res) {
          should.not.exist(err);
          done();
        });
    });
    it('wildcard in name', function (done) {
      request(app).post('/token')
        .send({username: 'T%r', password: 'test1234', scope: 'client'})
        .expect(401)
        .end(function (err, res) {
          should.not.exist(err);
          done();
        });
    });
  });
});

describe('Users Timing Vulnerability Tests', function () {
  'use strict';
  this.timeout(5000);

  var i, idx,
      loginAttempts = 100,
      warmupRequestCount = 5,
      timingDifferenceNanoseconds = 1000000,
      dictionary = 'abcdefghijklmnopqrstuvwxyz1234567890',
      badPassword = 'kjsdflkj3849jfjf';

  function random_username(length) {
    // Random username of a certain length
    var j, username = '';
    for (j = 0; j < length; j = j + 1) {
      username = username + dictionary[Math.floor(Math.random() * dictionary.length)];
    }
    return username;
  }

  function now() {
    // Current time in nanoseconds
    var hrtime = process.hrtime();
    return hrtime[0] * 1e9 + hrtime[1];
  }

  function makeHeaderFunc(validUsername) {
    // Build a header function which appends
    // the start time and whether the request
    // is valid
    var reqStart = now().toString();
    if (validUsername) {
      return function (res) {
        res.headers.valid = 'true';
        res.headers.req_start = reqStart;
      };
    }

    return function (res) {
      res.headers.valid = 'false';
      res.headers.req_start = reqStart;
    };
  }

  beforeEach(function (done) {
    db.sequelize.sync({force: true}).then(function (err) {
      factory.create('testUser', function (err, u) {
        if (err) {
          console.log(err);
        }
        done();
      });
    });
  });

  describe("User's authentication", function () {
    it('valid / invalid credential timing is within ' + (timingDifferenceNanoseconds/1000000) + 'ms', function (done) {
      var valid,
        invalidCount = 0,
        validCount = 0,
        invalidTotalTime = 0,
        validTotalTime = 0,
        avgValidCredsTime,
        avgInvalidCredsTime,
        difference,
        requests = [];

      function handleRequestEnd(err, res) {
        should.not.exist(err);

        // Calculate the stats
        var validRequest = res.headers.valid === 'true',
          start = Number(res.headers.req_start),
          elapsed = now() - start;

        // Ignore stats if this is a warmup request
        if (next_request.username.indexOf('warmup') !== 0) {
          if (validRequest) {
            validTotalTime = validTotalTime + elapsed;
            validCount = validCount + 1;
          } else {
            invalidTotalTime = invalidTotalTime + elapsed;
            invalidCount = invalidCount + 1;
          }
        }

        if (requests.length === 0) {
          // If there are no more requests calculate the difference between the average
          // times and check against a max value
          avgInvalidCredsTime = invalidTotalTime.toFixed(1) / loginAttempts.toFixed(1);
          avgValidCredsTime = validTotalTime.toFixed(1) / loginAttempts.toFixed(1);
          difference = Math.abs(avgValidCredsTime - avgInvalidCredsTime);
          should(difference).not.be.above(timingDifferenceNanoseconds);
          done();
        } else {
          // Grab the next request and execute it
          next_request = requests.pop();
          request(app).post('/token')
            .send({username: next_request.username, password: badPassword, scope: 'client'})
            .expect(401)
            .expect(makeHeaderFunc(next_request.valid))
            .end(handleRequestEnd);
        }
      }

      // Build a set of valid and invalid requests
      for (i = 0; i < loginAttempts; i = i + 1) {
        valid = (i % 2 === 0);
        requests.push({
          username: valid ? 'testuser' : random_username(8),
          valid: valid
        });
      }

      // Build some warmup requests that will not be
      // included in statistics
      for (i = 0; i < warmupRequestCount; i = i + 1) {
        requests.push({
          username: 'warmup' + random_username(8),
          valid: true
        });
      }

      // Grab the first request and execute it
      var next_request = requests.pop();
      request(app).post('/token')
        .send({username: next_request.username, password: badPassword, scope: 'client'})
        .expect(401)
        .expect(makeHeaderFunc(next_request.valid))
        .end(handleRequestEnd);
    });
  });
});