/* eslint-disable arrow-parens */
/* eslint-disable no-underscore-dangle */
const express = require('express');
const expressWs = require('express-ws');
const cors = require('cors')();
const uuidv4 = require('uuid/v4');
const crypt = require('./crypt');
const db = require('../database/interface.js');
const SweeperGame = require('./game.js');
const { URL } = require('../env').database;
const WS = require('./actions');
const { TIME: T, assert, sessionIsValid, userIsValid, resultIsTrue } = require('./utils');

const json = express.json();
const serveClient = express.static('client/dist');
const server = express();
const serverWs = expressWs(server);

const activeSessions = {};

const games = {
  easy: SweeperGame.Create('easy'),
  medium: SweeperGame.Create('medium'),
  hard: SweeperGame.Create('hard'),
};
server.tickTime = () => {
  const keys = Object.keys(games);
  for (let i = 0; i < keys.length; i += 1) {
    const gameMode = keys[i];
    let game = games[gameMode];
    game.timer -= 1;
    console.log('mode:', gameMode);
    if (game.timer < -60) {
      games[gameMode] = SweeperGame.Create(gameMode);
      game = games[gameMode];
      serverWs.getWss().clients.forEach((client) => {
        console.log('client', i);
        client.send(JSON.stringify({
          type: WS.SEND_CURRENT_GAME,
          data: {
            board: game.board,
            stats: {
              minesLeft: game.mineCount,
              clearLeft: game.safeCount,
              timer: game.timer,
              status: game.status,
              deaths: game.deaths,
              flagCount: game.flagCount,
            },
          },
        }));
      });
    } else {
      serverWs.getWss().clients.forEach((client) => {
        if (client.gameMode === gameMode) {
          console.log('client', i);
          client.send(JSON.stringify({
            type: WS.SEND_GAME_STATS,
            data: {
              stats: {
                minesLeft: game.mineCount,
                clearLeft: game.safeCount,
                timer: game.timer < 0 ? 59 + game.timer : game.timer,
                status: game.status,
                deaths: game.deaths,
                flagCount: game.flagCount,
              },
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
      activeSessions[sessionOwner] = Date.now() + T.HOUR;
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
      activeSessions[sessionOwner] = Date.now() + T.HOUR;
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
    console.log('string msgStr:', JSON.stringify(msgStr));
    const { type, data, session } = JSON.parse(msgStr);
    if (activeSessions[session] < Date.now()) {
      if (db.checkSession(session) === undefined) {
        ws.close();
        delete activeSessions[session];
        return;
      }
      activeSessions[session] = Date.now() + T.HOUR;
    }
    switch (type) {
      // WebSocket Message Types

      case WS.REQ_CLOSE:
        ws.close();
        break;

      case WS.REQ_CURRENT_GAME:
        ws.send(JSON.stringify({
          type: WS.SEND_CURRENT_GAME,
          data: {
            board: games[gameMode].getVisibleBoard(),
            stats: {
              minesLeft: games[gameMode].mineCount,
              clearLeft: games[gameMode].safeCount,
              status: games[gameMode].status,
              timer: games[gameMode].timer,
              deaths: games[gameMode].deaths,
              flagCount: games[gameMode].flagCount,
            },
          },
        }));
        break;

      case WS.REQ_SWEEP:
        // eslint-disable-next-line no-case-declarations
        const { spaces } = games[gameMode].sweepPosition(data.y, data.x, data.player);
        if (spaces.length > 0) {
          serverWs.getWss().clients.forEach((client) => {
            if (client.gameMode === gameMode) {
              client.send(JSON.stringify({
                type: WS.SEND_SWEEP_RESULT,
                data: {
                  spaces,
                  stats: {
                    minesLeft: games[gameMode].mineCount,
                    clearLeft: games[gameMode].safeCount,
                    status: games[gameMode].status,
                    timer: games[gameMode].timer,
                    deaths: games[gameMode].deaths,
                    flagCount: games[gameMode].flagCount,
                  },
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
                  stats: {
                    minesLeft: games[gameMode].mineCount,
                    clearLeft: games[gameMode].safeCount,
                    status: games[gameMode].status,
                    timer: games[gameMode].timer,
                    deaths: games[gameMode].deaths,
                    flagCount: games[gameMode].flagCount,
                  },
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
