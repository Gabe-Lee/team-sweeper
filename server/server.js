/* eslint-disable arrow-parens */
/* eslint-disable no-underscore-dangle */
const express = require('express');
const expressWs = require('express-ws');
const cors = require('cors')();
const uuidv4 = require('uuid/v4');
const crypt = require('./crypt');
const db = require('../database/interface.js');
const SweeperGame = require('./game_logic/Game');
const { URL } = require('../env').database;
const WS = require('./actions');
const { TIME: T, assert, sessionIsValid, userIsValid, resultIsTrue } = require('./utils');

const json = express.json();
const serveClient = express.static('client/dist');
const server = express();
const serverWs = expressWs(server);

const activeSessions = {};

const games = {
  easy: new SweeperGame({ mode: 'easy' }),
  medium: new SweeperGame({ mode: 'medium' }),
  hard: new SweeperGame({ mode: 'hard' }),
  extreme: new SweeperGame({ mode: 'extreme' }),
};
server.tickTime = () => {
  const keys = Object.keys(games);
  for (let i = 0; i < keys.length; i += 1) {
    const gameMode = keys[i];
    let game = games[gameMode];
    game.tickTime(1);
    if (game.timer < -60) {
      games[gameMode] = new SweeperGame({ mode: gameMode });
      game = games[gameMode];
      serverWs.getWss().clients.forEach((client) => {
        if (client.gameMode === gameMode) {
          client.send(JSON.stringify({
            type: WS.SEND_CURRENT_GAME,
            data: {
              board: game.board,
              stats: game.stats,
            },
          }));
        }
      });
    } else {
      serverWs.getWss().clients.forEach((client) => {
        if (client.gameMode === gameMode) {
          client.send(JSON.stringify({
            type: WS.SEND_GAME_STATS,
            data: {
              stats: game.stats,
            },
          }));
        }
      });
    }
  }
  setTimeout(server.tickTime, T.SECOND);
};
server.tickTime();

server.use(cors);
server.use(json);
// server.use(cookieParser);

server.use('/', serveClient);

server.post('/session', (req, res) => {
  const { session } = req.body;
  console.log('session login:', session);
  let sessionOwner = null;
  db.checkSession(session)
    .then(assert(sessionIsValid))
    .then((validSession) => {
      sessionOwner = validSession.owner;
      return db.getUserById(sessionOwner);
    })
    .then(assert(userIsValid))
    .then((validUser) => {
      const clientUser = { ...validUser, hash: undefined, _id: undefined };
      activeSessions[session] = { id: sessionOwner, player: clientUser, expires: Date.now() + T.HOUR };
      res.status(200).send(JSON.stringify(clientUser));
    })
    .catch(() => {
      res.status(200).send(JSON.stringify(false));
    });
});

server.post('/login', (req, res) => {
  const { name, password } = req.body;
  console.log('login:', name, password)
  let validUser = null;
  db.getUser(name)
    .then(assert(userIsValid))
    .then((user) => {
      validUser = user;
      return crypt.compareHash(password, validUser.hash);
    })
    .then(assert(resultIsTrue))
    .then(() => {
      const newUuid = uuidv4();
      const newExpires = Date.now() + 604800000;
      const sessionOwner = validUser._id;
      db.newSession({
        uuid: newUuid,
        owner: sessionOwner,
        loggedIn: true,
        expires: newExpires,
      });
      const clientUser = { ...validUser, hash: undefined, _id: undefined };
      activeSessions[newUuid] = { id: sessionOwner, player: clientUser, expires: Date.now() + T.HOUR };
      res.status(200).send(JSON.stringify({ user: clientUser, session: newUuid }));
    })
    .catch(() => {
      res.status(200).send(null);
    });
});

server.ws('/game/:mode', (ws, req) => {
  const gameMode = req.params.mode;
  ws.gameMode = gameMode;
  ws.on('message', (msgStr) => {
    console.log('msgStr:', msgStr);
    const { type, data, session } = JSON.parse(msgStr);
    if (activeSessions[session].expires < Date.now()) {
      console.log('session expired, checking database')
      if (db.checkSession(activeSessions[session].id) === undefined) {
        console.log('db session expired, deleting session');
        ws.close();
        delete activeSessions[session];
        return;
      }
      activeSessions[session].expires = Date.now() + T.HOUR;
    }
    switch (type) {
      // WebSocket Message Types

      case WS.REQ_CLOSE:
        ws.close();
        break;

      case WS.REQ_CURRENT_GAME:
        games[gameMode].addPlayer(activeSessions[session].player);
        ws.send(JSON.stringify({
          type: WS.SEND_CURRENT_GAME,
          data: {
            board: games[gameMode].visibleBoard,
            stats: games[gameMode].stats,
          },
        }));
        break;

      case WS.REQ_SWEEP:
        // eslint-disable-next-line no-case-declarations
        const { spaces } = games[gameMode].sweepPosition(data.y, data.x, activeSessions[session].player.name);
        console.log(spaces)
        if (spaces.length > 0) {
          serverWs.getWss().clients.forEach((client) => {
            if (client.gameMode === gameMode) {
              client.send(JSON.stringify({
                type: WS.SEND_SWEEP_RESULT,
                data: {
                  spaces,
                  stats: games[gameMode].stats,
                },
              }));
            }
          });
        }
        break;

      case WS.REQ_FLAG:
        // eslint-disable-next-line no-case-declarations
        const { newFlag } = games[gameMode].flagPosition(data.y, data.x, data.player);
        if (newFlag) {
          serverWs.getWss().clients.forEach((client) => {
            if (client.gameMode === gameMode) {
              client.send(JSON.stringify({
                type: WS.SEND_FLAG_RESULT,
                data: {
                  spaces: [{ x: data.x, y: data.y, space: -2 }],
                  stats: games[gameMode].stats,
                },
              }));
            }
          });
        }
        break;

      default:
        ws.send({ type: WS.SEND_ERROR, data: 'Message type not recognized' });
    }
  });
});

module.exports = server;
