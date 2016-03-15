var config = require('./../config');

module.exports = function(io,auth, streams) {
  io.use(function(socket, next){
    var handshake = socket.request;
    var token = handshake._query.auth_token || handshake._query.token;
    if (!token) {
      return next(new Error('no token found'));
    }

    auth.validateToken(token, function (err, user, info) {
      if (err) {
        return next(err);
      }
      if (!user) {
        return next(new Error('no user found'));
      }
      if (info.scope && info.scope.indexOf('admin') === -1) {
        return next(null, false);
      }
      next(null, true);
    });
  });

  io.on('connection', function (client) {
    var handshake = client.handshake;
    var token = handshake.query.token || handshake.query.auth_token;
    if (!token) {
      return;
    }
    var clientType = handshake.query.clientType;

    auth.validateToken(token, function (err, user, info) {
      if (err) {
        return;
      }
      if (!user) {
        return;
      }


      console.log('-- ' + client.id + ' joined --');

        client.on('readyToStream', function (options) {
          console.log('-- ' + client.id + ' is ready to stream --');

        streams.addStream(client.id, options.name, user.id, user.groupId );
        io.emit('streaming:start', { id : user.id,
          groupId: user.groupId,
          ipAddress: config.wowza.ipAddress,
          streamingPort: config.wowza.port,
          streamingUser: config.wowza.user,
          streamingPassword: config.wowza.password,
          streamingPath: config.wowza.path + user.id + '.stream',
        });
      });

        function leave() {
          console.log('-- ' + client.id + ' left --' + clientType);
          if ("admin" != clientType) {
            io.emit('streaming:stop', {id: user.id});
            streams.removeStream(client.id);
          }
        }

        client.on('disconnect', leave);
        client.on('leave', leave);

        client.on('alreadyConnected', function (options) {
          console.log('already connected');
          io.sockets.connected[options.to].emit('streaming:alreadyConnected', {id: user.id});
        });
        client.on('failed', function (options) {
          console.log('failed');
          io.sockets.connected[options.to].emit('streaming:failed', {id: user.id});
        });
      });
    });
};
