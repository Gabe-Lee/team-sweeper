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
  ws.send('You connected to server!');
  ws.on('message', (data) => {
    ws.send(`You sent: ${data}`);
    if (data === 'kill') {
      ws.close();
    }
  });
});

module.exports = server;
