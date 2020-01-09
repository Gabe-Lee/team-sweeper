const express = require('express');
const expressWs = require('express-ws');
const cors = require('cors')();

const json = express.json();
const serveClient = express.static('client/dist');
const server = express();
// eslint-disable-next-line no-unused-vars
const serverWs = expressWs(server);

server.use(cors);
server.use(json);

server.use('/', serveClient);

server.ws('/game', (ws, req) => {
  ws.send(JSON.stringify({
    type: 'NEW_GAME',
    data: {
      board: [
        [-3,-2,-1, 0, 0],
        [ 1, 2, 3, 4, 0],
        [ 5, 6, 7, 8, 0],
        [ 9,10,11,12, 0],
        [ 0, 0, 0, 0, 0],
      ],
      mines: 3,
      timer: 600000,
    }
  }));
  ws.on('message', (data) => {
    ws.send(`You sent: ${data}`);
    if (data === 'kill') {
      ws.close();
    }
  });
});

module.exports = server;
