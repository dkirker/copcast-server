/**
 * Module dependencies.
 */

var db = require('./lib/db')
  , config = require('./lib/config')
  , rabbitmq = require('./lib/rabbitmq')
  , storage = require('./lib/videos/storage')

  , crypto = require('./lib/crypto');



var option = {force: false};
//if (process.env.NODE_ENV == "test"){
//  option["force"] = true;
//}

db.sequelize.sync(option).then(function () {
  //if (err) {
  //  throw err;
  //} else {
  crypto.crypto_init(function () {
    rabbitmq.init(function () {
      rabbitmq.connection().queue('copcast-q', function(q) {
        console.log('Queue ' + q.name + ' is open');
        q.bind(rabbitmq.exchange(), 'copcast-k', function(o) {
          console.log('ready: '+config.parallel_videos);
          q.subscribe({ack: true, prefetchCount: config.parallel_videos}, function (message, headers, deliveryInfo, ack) {
            try{
              storage.ingestVideo(message.path, message.user.id, message.date, function(code) {
                console.log(message.path);
                ack.acknowledge();
              });
            } catch(err) {
              console.log(err);
            }
          });
        });
      });
    });
  });
});
