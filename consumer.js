/**
 * Module dependencies.
 */

var db = require('./lib/db')
  , config = require('./lib/config')
  , rabbitmq = require('./lib/rabbitmq')
  , storage = require('./lib/videos/storage')
  , crypto = require('./lib/crypto');


var option = {force: false};

db.sequelize.sync(option).then(function () {
  crypto.crypto_init(function () {
    rabbitmq.init(function () {
      rabbitmq.connection().queue('copcast-q', function(q) {
        console.log('Queue ' + q.name + ' is open');
        q.bind(rabbitmq.exchange(), 'copcast-k', function() {
          console.log('Consumer ready. Maximum parallel executions: '+config.rabbitmq.prefetchCount);
          q.subscribe({ack: true, prefetchCount: config.parallel_videos}, function (message, headers, deliveryInfo, ack) {
            try{
              console.log('Begining ingestion: '+message.path);
              storage.ingestVideo(message.path, message.user.id, message.date, function(code, err) {
                if (err)
                  console.log(err);
                else
                  console.log(message.path+' file ingested.');

                ack.acknowledge();
              });
            } catch(err) {
              console.log('Error ingesting video: '+err);
            }
          });
        });
      });
    });
  });
}).catch(function(err) {
  console.log('Failed to access the database.');
  console.log(err);
  process.exit(-1);
});
