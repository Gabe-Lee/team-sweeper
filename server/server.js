const express = require('express');
const expressWs = require('express-ws');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const cors = require('cors')();
const SweeperGame = require('./game.js');
const db = require('../database/interface.js');
const crypt = require('./crypt');
const { URL } = require('../env').database;

const json = express.json();
const serveClient = express.static('client/dist');
const server = express();
const serverWs = expressWs(server);
const sess = {
  secret: '3secret5me',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 3600000 },
  store: new MongoStore({ url: URL }),
};

let game = new SweeperGame(35, 15, 900);
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
server.use(session(sess));

server.use('/', serveClient);

server.ws('/game', (ws, req) => {
  console.log(req.session);
  if (req.session === undefined) {
    req.session.regenerate();
  }
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
      } else if (data.type === 'LOGIN') {
        const { name, password } = data.data;
        db.getUser(name)
          .then((user) => {
            if (user === null) {
              req.session.loggedIn = true;
              return crypt.createHash(password)
                .then((hash) => db.addUser(name, hash));
            }
            if (req.session.loggedIn === true) {
              return user;
            }
            return crypt.compareHash(password, user.hash)
              .then((res) => {
                if (!res) throw new Error('Password mismatch');
                req.session.loggedIn = true;
                delete user.hash;
                delete user._id;
                return user;
              });
          })
          .then((user) => {
            ws.send(JSON.stringify({ type: 'LOGGED', data: { user }}));
            if (game.players[user.name] === undefined) {
              game.players[user.name] = {};
              game.players[user.name].alive = true;
              game.players[user.name].score = 0;
            }
          })
          .catch((err) => {
            console.log(err);
            ws.send({type: 'ERROR'});
          });
      }
    }
  });
});

module.exports = server;
