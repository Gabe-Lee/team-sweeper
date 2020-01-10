const express = require('express');
const expressWs = require('express-ws');
const cors = require('cors')();
const SweeperGame = require('./game.js');

const json = express.json();
const serveClient = express.static('client/dist');
const server = express();
const serverWs = expressWs(server);

let game = new SweeperGame(30, 25, 900);
server.tickTime = () => {
  game.timer -= 1;
  if (game.timer < -60) {
    game = new SweeperGame(30, 25, 900);
    serverWs.getWss('/game').clients.forEach((client) => {
      client.send(JSON.stringify({
        type: 'CURRENT_GAME',
        data: {
          board: game.getVisibleBoard(),
          mineCount: game.mineCount,
          safeCount: game.safeCount,
          timer: game.timer,
          status: game.status,
          deaths: game.deaths,
        },
      }));
    });
  }
  serverWs.getWss('/game').clients.forEach((client) => {
    client.send(JSON.stringify({ type: 'TICK_TIME', data: { timer: game.timer, status: game.status, playerList: game.players }}));
  });
  setTimeout(server.tickTime, 1000);
};
server.tickTime();

server.use(cors);
server.use(json);

server.use('/', serveClient);

server.ws('/game', (ws, req) => {
  ws.send(JSON.stringify({
    type: 'CURRENT_GAME',
    data: {
      board: game.getVisibleBoard(),
      mineCount: game.mineCount,
      safeCount: game.safeCount,
      timer: game.timer,
      status: game.status,
      deaths: game.deaths,
      flags: game.uniqueFlags,
    },
  }));
  ws.on('message', (message) => {
    if (message === 'close') {
      ws.close();
    } else {
      const data = JSON.parse(message);
      if (data.type === 'SWEEP') {
        const { x, y, player } = data.data;
        const { spaces, safeCount, mineCount, deaths, died } = game.sweepPosition(y, x, player);
        if (spaces.length > 0) {
          serverWs.getWss('/game').clients.forEach((client) => {
            client.send(JSON.stringify({ type: 'SWEPT', data: { spaces, safeCount, mineCount, deaths, died }}));
          });
        }
      } else if (data.type === 'FLAG') {
        const { x, y, player } = data.data;
        const { newFlag, status } = game.flagPosition(y, x, player);
        if (newFlag) {
          serverWs.getWss('/game').clients.forEach((client) => {
            client.send(JSON.stringify({ type: 'FLAGGED', data: { x, y, space: status ? -2 : -1, flags: game.uniqueFlags }}));
          });
        }
      }
    }
  });
});

module.exports = server;
