/* eslint-disable no-param-reassign */
const db = require('../database/interface.js');
const WS = require('./actions');
const { TIME: T } = require('./utils');

const gameRoute = (serverWs, ws, req, mode, activeSessions, games) => {
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
            board: games[mode].getVisibleBoard(),
            stats: {
              minesLeft: games[mode].mineCount,
              clearLeft: games[mode].safeCount,
              status: games[mode].status,
              timer: games[mode].timer,
              deaths: games[mode].deaths,
              flagCount: games[mode].flagCount,
            },
          },
        }));
        break;

      case WS.REQ_SWEEP:
        // eslint-disable-next-line no-case-declarations
        const { spaces } = games[mode].sweepPosition(data.y, data.x, data.player);
        if (spaces.length > 0) {
          serverWs.getWss('/game').clients.forEach((client) => {
            client.send(JSON.stringify({
              type: WS.SEND_SWEEP_RESULT,
              data: {
                spaces,
                stats: {
                  minesLeft: games[mode].mineCount,
                  clearLeft: games[mode].safeCount,
                  status: games[mode].status,
                  timer: games[mode].timer,
                  deaths: games[mode].deaths,
                  flagCount: games[mode].flagCount,
                },
              },
            }));
          });
        }
        break;

      case WS.REQ_FLAG:
        // eslint-disable-next-line no-case-declarations
        const { newFlag } = games[mode].flagPosition(data.y, data.x, data.player);
        if (newFlag) {
          serverWs.getWss('/game').clients.forEach((client) => {
            client.send(JSON.stringify({
              type: WS.SEND_FLAG_RESULT,
              data: {
                spaces: [{ x: data.x, y: data.y, space: -2 }],
                stats: {
                  minesLeft: games[mode].mineCount,
                  clearLeft: games[mode].safeCount,
                  status: games[mode].status,
                  timer: games[mode].timer,
                  deaths: games[mode].deaths,
                  flagCount: games[mode].flagCount,
                },
              },
            }));
          });
        }
        break;

      default:
        ws.send({ type: WS.SEND_ERROR, data: 'Message type not recognized' });
    }
  });
};
module.exports = gameRoute;
