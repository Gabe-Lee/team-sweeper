const express = require('express');
const expressWs = require('express-ws');
const cors = require('cors')();
const SweeperGame = require('./game');

const json = express.json();
const serveClient = express.static('client/dist');
const server = express();
// eslint-disable-next-line no-unused-vars
const serverWs = expressWs(server);

const game = new SweeperGame(50, 50);

server.use(cors);
server.use(json);

server.use('/', serveClient);

server.ws('/game', (ws, req) => {
  ws.send(JSON.stringify({
    type: 'CURRENT_GAME',
    data: {
      board: game.getVisibleBoard(),
      safeCount: game.safeCount,
      timer: 6000000,
    }
  }));
  ws.on('message', (message) => {
    if (message === 'close') {
      ws.close();
    } else {
      const data = JSON.parse(message);
      console.log(data);
      if (data.type === 'SWEEP') {
        const { x, y, player } = data.data;
        console.log(x, y, player);
        const result = game.sweepPosition(y, x, player);
        if (result !== -1) {
          serverWs.getWss('/game').clients.forEach((client) => {
            client.send(JSON.stringify({ type: 'SWEPT', data: {x, y, result}}));
          });
        }
      }
    }
  });
});

module.exports = server;
