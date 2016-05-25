var
  WebSocketServer = require('ws').Server
  , url = require('url')
  , auth = require('../auth')

var admin_clients = {};

var broadcast = function(id, message) {

  //console.log('Broadcasting from client ID: '+id);
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

    var tkn = wsocket.upgradeReq.headers.authorization;

    if (tkn == null) {
      tkn = JSON.parse(decodeURIComponent(wsocket.upgradeReq.headers.cookie).split('globals')[1].split('=')[1].split(';')[0]).currentUser.token;
    }

    console.log(tkn);

    auth.validateToken(tkn, function(err, user) {

      if (err != null || user == null || !user) {
        wsocket.close(1008, "Invalid token");
        return;
      }

      var uri = wsocket.upgradeReq.url;
      var params = url.parse(uri, true).query;
      console.log(params);

      if(('ismobile' in wsocket.upgradeReq.headers)) {
        console.log("mobile connected with id: "+user.id);
        wsocket.on('message', function (data) {
          broadcast(user.id, data);
        });
      } else {
        console.log("admin connected with id: "+user.id+" watching user: "+params.id);

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
      } // admin if
    }); // validateToken
  }); // on Connection
}

module.exports.setupWebsockerServer = setupWebsockerServer;
