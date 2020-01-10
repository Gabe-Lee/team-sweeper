const express = require('express');
const expressWs = require('express-ws');
const cors = require('cors')();
const SweeperGame = require('./game.js');
const db = require('../database/interface.js');
const crypt = require('./crypt');
const uuidv4 = require('uuid/v4');
const cookieParser = require('cookie-parser')();
const { URL } = require('../env').database;
const WS = require('./actions');

const json = express.json();
const serveClient = express.static('client/dist');
const server = express();
const serverWs = expressWs(server);


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
          deaths: `${game.deaths}/${game.maxDeaths}`,
        },
      }));
    });
  }
  serverWs.getWss('/game').clients.forEach((client) => {
    client.send(JSON.stringify({ type: 'TICK_TIME', data: { timer: game.timer < 0 ? 59 + game.timer : game.timer, status: game.status, playerList: game.players }}));
  });
  setTimeout(server.tickTime, 1000);
};
server.tickTime();

server.use(cors);
server.use(json);
server.use(cookieParser);

server.use('/', serveClient);

server.ws('/game', (ws, req) => {
  console.log(req.cookies.session);
  if (req.cookies.session === undefined || req.cookies.session.expires < Date.now()) {
    const newUuid = uuidv4();
    const newExpires = Date.now() + 604800000;
    db.newSession({
      uuid: newUuid,
      owner: null,
      loggedIn: false,
      expires: newExpires,
    });
    ws.cookie('session', newUuid, { expires: new Date(newExpires), httpOnly: true });
  }
  const sessionUuid = req.cookies.session || ws.cookies.session;
  // ws.send(JSON.stringify({
  //   type: 'CURRENT_GAME',
  //   data: {
  //     board: game.getVisibleBoard(),
  //     mineCount: game.mineCount,
  //     safeCount: game.safeCount,
  //     timer: game.timer,
  //     status: game.status,
  //     deaths: `${game.deaths}/${game.maxDeaths}`,
  //     flags: game.uniqueFlags,
  //   },
  // }));
  ws.on('message', (msgStr) => {
    const { type, data } = JSON.parse(msgStr);
    switch (type) {
      // WebSocket Message Types

      case WS.REQ_CLOSE:
        ws.close();
        break;

      case WS.REQ_SESSION_LOGIN:
        db.checkSession(sessionUuid)
          .then((session) => {
            if (session === null
              || session.loggedIn !== true
              || session.owner === null
              || session.uuid === undefined
              || session.expires < Date.now()) {
              ws.send({ type: WS.SEND_ERROR, data: 'Session Not Valid For Login' });
            } else {
              db.getUser(session.owner)
                .then((user) => {
                  delete user._id;
                  delete user.hash;
                  ws.send({ type: WS.SEND_USER, data: user });
                });
            }
          });
        break;

      case WS.REQ_USER_LOGIN:
        db.getUser(data.name)
          .then((user) => crypt.compareHash(data.password, user.hash))
          .then((matches) => {
            if (!matches) {
              ws.send({ type: WS.SEND_ERROR, data: 'Password Mismatch' });
            } else {
              db.getUser(data.name)
                .then((user) => {
                  delete user.hash;
                  delete user._id;
                  ws.send({ type: WS.SEND_USER, data: user });
                });
            }
          });
        break;

      case WS.SWEEP:
        // eslint-disable-next-line no-case-declarations
        const { spaces } = game.sweepPosition(data.y, data.x, data.player);
        if (spaces.length > 0) {
          serverWs.getWss('/game').clients.forEach((client) => {
            client.send(JSON.stringify({
              type: WS.SEND_SWEEP_RESULT,
              data: {
                spaces,
                safeCount: game.safeCount,
                mineCount: game.mineCount,
                deaths: `${game.deaths}/${game.maxDeaths}`,
              },
            }));
          });
        }
        break;

      case WS.FLAG:
        // eslint-disable-next-line no-case-declarations
        const { newFlag, status } = game.flagPosition(data.y, data.x, data.player);
        if (newFlag) {
          serverWs.getWss('/game').clients.forEach((client) => {
            client.send(JSON.stringify({
              type: WS.SEND_FLAG_RESULT,
              data: {
                x,
                y,
                space: status ? -2 : -1,
                flags: game.uniqueFlags,
              },
            }));
          });
        }

      default:
        ws.send({ type: WS.SEND_ERROR, data: 'Message type not recognized' });
    }
    if (message === 'close') {
      ws.close();
    } else {
      const data = JSON.parse(message);
      if (data.type === 'SWEEP') {
        const { x, y, player } = data.data;
        const { spaces, safeCount, mineCount, deaths, died } = game.sweepPosition(y, x, player);
        if (spaces.length > 0) {
          serverWs.getWss('/game').clients.forEach((client) => {
            client.send(JSON.stringify({ type: 'SWEPT', data: { spaces, safeCount, mineCount, deaths: `${game.deaths}/${game.maxDeaths}`, died }}));
          });
        }
      } else if (data.type === 'FLAG') {
        const { x, y, player } = data.data;
        const { newFlag, status } = game.flagPosition(y, x, player);
        if (newFlag) {
          serverWs.getWss('/game').clients.forEach((client) => {
            client.send(JSON.stringify({ type: WS.SEND_FLAG_RESULT, data: { x, y, space: status ? -2 : -1, flags: game.uniqueFlags }}));
          });
        }
      } else if (data.type === 'S_LOGIN') {
        if (!req.session || !req.session.loggedIn || !req.session.owner || !req.session.sessionID) return;
        const {owner, sessionID} = req.session;
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
