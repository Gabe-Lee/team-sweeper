/* eslint-disable no-underscore-dangle */
const express = require('express');
const expressWs = require('express-ws');
const cors = require('cors')();
const uuidv4 = require('uuid/v4');
// const cookieParser = require('cookie-parser')();
const crypt = require('./crypt');
const db = require('../database/interface.js');
const SweeperGame = require('./game.js');
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
    client.send(JSON.stringify({ type: 'TICK_TIME', data: { timer: game.timer < 0 ? 59 + game.timer : game.timer, status: game.status, playerList: game.players } }));
  });
  setTimeout(server.tickTime, 1000);
};
server.tickTime();

server.use(cors);
server.use(json);
// server.use(cookieParser);

server.use('/', serveClient);

server.post('/session', (req, res) => {
  const { session } = req.body;
  console.log('session login:', session)
  let sessionOwner = null;
  db.checkSession(session)
    .then((owner) => {
      sessionOwner = owner;
      if (sessionOwner === undefined) {
        res.status(200).send(JSON.stringify(false));
      } else {
        console.log(sessionOwner);
        db.getUserById(sessionOwner)
          .then((user) => {
            if (user === undefined) {
              console.log('not found');
              res.status(200).end();
            } else {
              delete user.hash;
              delete user._id;
              res.status(200).send(JSON.stringify(user));
            }
          })
          .catch((err) => {
            res.status(500).send(JSON.stringify(null));
          });
      }
    });

});

server.post('/login', (req, res) => {
  const { name, password } = req.body;
  console.log('login:', name, password)
  let foundUser = null;
  db.getUser(name)
    .then((user) => {
      foundUser = user;
      return crypt.compareHash(password, user.hash);
    })
    .then((matches) => {
      if (!matches) {
        res.status(200).send(null);
      } else {
        const newUuid = uuidv4();
        const newExpires = Date.now() + 604800000;
        db.newSession({
          uuid: newUuid,
          owner: foundUser._id,
          loggedIn: true,
          expires: newExpires,
        });
        delete foundUser.hash;
        delete foundUser._id;
        res.status(200).send(JSON.stringify({ user: foundUser, session: newUuid }))
      }
    })
    .catch(() => {
      res.status(404).send(null);
    });
});

server.ws('/game', (ws, req) => {
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
    console.log('msgStr:', msgStr);
    console.log('string msgStr:', JSON.stringify(msgStr));
    const { type, data, session } = JSON.parse(msgStr);
    if (db.checkSession(session) === undefined) {
      ws.close();
      return;
    }
    switch (type) {
      // WebSocket Message Types

      case WS.REQ_CLOSE:
        ws.close();
        break;

      // case WS.REQ_SESSION_LOGIN:
      //   db.checkSession(sessionUuid)
      //     .then((session) => {
      //       if (session === null
      //         || session.loggedIn !== true
      //         || session.owner === null
      //         || session.uuid === undefined
      //         || session.expires < Date.now()) {
      //         ws.send({ type: WS.SEND_ERROR, data: 'Session Not Valid For Login' });
      //       } else {
      //         db.getUser(session.owner)
      //           .then((user) => {
      //             delete user._id;
      //             delete user.hash;
      //             ws.send({ type: WS.SEND_USER, data: user });
      //           });
      //       }
      //     });
      //   break;

      // case WS.REQ_USER_LOGIN:
      //   console.log('type: ', type)
      //   db.getUser(data.name)
      //     .then((user) => crypt.compareHash(data.password, user.hash))
      //     .then((matches) => {
      //       if (!matches) {
      //         ws.send({ type: WS.SEND_ERROR, data: 'Password Mismatch' });
      //       } else {
      //         db.getUser(data.name)
      //           .then((user) => {
      //             delete user.hash;
      //             delete user._id;
      //             ws.send({ type: WS.SEND_USER, data: user });
      //           });
      //       }
      //     });
      //   break;

      case WS.REQ_SWEEP:
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

      case WS.REQ_FLAG:
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
        break;

      default:
        ws.send({ type: WS.SEND_ERROR, data: 'Message type not recognized' });
    }
  });
});

module.exports = server;
