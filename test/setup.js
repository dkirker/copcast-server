/**
 * Created by brunosiqueira on 11/05/16.
 */
require('factory-girl-sequelize')();
var factory = require('factory-girl');
var db = require('./../lib/db');
var moment = require('moment');


//password: test1234
var passwordHash = '5xQPakqxSn+c4wFkFardSkO6Z96hExW/Ei/kAL98UnRYaGr+UC5OujXQc8bRM7sRr4N3UJGNxLkPYJuC+JMcyLSR+0Hz7zcZzWqI367kjUKiEGJWF9uddKTHlBANtZsiMrPASgZw7gZyS8pDNXNVsO753eb7mwg5jVLFcDpEEsRaP2HvotrPbsruA0Mp4rc0EU+CYOlooRnFZT+zxbzWa06rCewV12guvzhYuEDmLC+nBhYPhHsWy99+UY5p1GtZ1uxsgbyX3skGals0QzGoS5nzMCx/PvNLLrJh5OhC03EUozXGqhi9VyIm2WKRCd8ZGJbMna2gGRW2yE4gUeHtbg==';
var passwordSalt = '200.EP+9cn1htwmjd3yhV2eWVKy1ozBq6rHP27jEK9UPEPQ=';

factory.define('groupAdmin', db.group, {
  name : 'Group Admin',
  isAdmin : true,
  lat : -21,
  lng : 43

});
factory.define('groupNoUser', db.group, {
  name : 'Group No User',
  isAdmin : true,
  lat : -21,
  lng : 43
});
factory.define('testUser', db.user, {
  username: 'testuser',
  name: 'Test User',
  email: 'testuser@gmail.com',
  role: 'admin_3',
  isAdmin: true,
  passwordHash: passwordHash,
  passwordSalt: passwordSalt,
  groupId: factory.assoc('groupAdmin', 'id')
});

factory.define('historyRecording', db.history, {
  previousState : 'IDLE',
  nextState : 'RECORDING',
  date : moment.utc().subtract(1, 'week'),
  userId : factory.assoc('testUser', 'id')
});
factory.define('historyStreaming', db.history, {
  previousState : 'RECORDING',
  nextState : 'STREAMING',
  date : moment.utc().subtract(1, 'week'),
  userId : factory.assoc('testUser', 'id')
});
factory.define('historyPaused', db.history, {
  previousState : 'RECORDING',
  nextState : 'PAUSED',
  date : moment.utc().subtract(1, 'week'),
  userId : factory.assoc('testUser', 'id')
});

module.exports = factory;
