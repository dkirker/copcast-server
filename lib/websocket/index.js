var
  WebSocketServer = require('ws').Server
  , url = require('url');

var admin_clients = {};

var broadcast = function(id, message) {

  messageconsole.log('Broadcasting for client: '+id);
  var clients = admin_clients[id];
  //if (clients != null)
  //  console.log(clients.length);

  if (clients != null)
    clients.forEach(function each(client) {
      try {
        console.log('broadcasting: '+message.length+' bytes');
        client.send(new Buffer(message).toString('base64'));
      } catch(err) {
        console.log('missing client');
        console.log(err);
        // remove client from list
        clients.splice(clients.indexOf(client), 1);
      }
    });

};

var setupWebsockerServer = function(http_server) {

  var wss = new WebSocketServer({server: http_server, path: '/ws'});

  wss.on('connection', function connection(wsocket) {

    var uri = wsocket.upgradeReq.url;
    var params = url.parse(uri, true).query;
    console.log(params);


    if(('ismobile' in wsocket.upgradeReq.headers)) {
      console.log("mobile connected with id: "+params.id);
      wsocket.on('message', function (data) {
        broadcast(params.id, data);
      });
    } else {
      console.log("admin connected for: "+params.id);

      clientes = admin_clients[params.id];
      if (clientes == null) {
        clientes = [];
        admin_clients[params.id] = clientes;
      }

      clientes.push(wsocket);
      console.log(admin_clients[params.id].length+ ' clients connected');

      wsocket.on('close', function connection() {
        console.log('admin left for: '+params.id);
        if (clientes.length > 0) {
          clientes.splice(clientes.indexOf(this), 1);
          console.log(clientes.length + ' clients left');
        }
      });

    }
  });

}

module.exports.setupWebsockerServer = setupWebsockerServer;
