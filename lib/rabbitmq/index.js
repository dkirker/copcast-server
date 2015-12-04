var amqp = require('amqp');

var exchange = null;
var conn = null;

var init = function(cb) {

  var connection = amqp.createConnection();

  connection.on('ready', function() {
    connection.exchange('copcast-e', {type: 'direct', confirm: true}, function (e) {
      exchange = e;
      conn = connection;
      console.log('RabbitMQ ready');
      try {
        cb();
      } catch(err){
        console.log(err);
      }
    });
  });
}

var push = function(data) {
  if (!exchange) {
    console.log('Invalid RabbitMQ exchange. Ignoring.');
    return;
  }

  exchange.publish('copcast-k', data);
}

var c = function() {
  return conn;
}

var ex = function() {
  return exchange;
}

module.exports.init = init;
module.exports.push = push;
module.exports.exchange = ex;
module.exports.connection = c;