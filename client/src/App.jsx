/* eslint-disable no-bitwise */
import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import utils from './utils';
import Board from './Board';
import Login from './Login';
import { server } from '../../env';
import PlayerList from './PlayerList';
import StatusBoard from './StatusBoard';
import WS from '../../server/actions';
import {
  createWebSocket, setBoard, updateBoard, updateStats, setPlayer, setSessionAttempted, setGameJoined,
} from './redux/actions';
import { FLAGS } from '../../server/game';

const App = () => {
  const [mounted, setMounted] = useState(false);

  const board = useSelector((store) => store.board);
  const player = useSelector((store) => store.player);
  const playerList = useSelector((store) => store.playerList);
  const {
    minesLeft, clearLeft, timer, status, deaths, flagCount,
  } = useSelector((store) => store.stats);
  const webSocket = useSelector((store) => store.webSocket);
  const { gameJoined } = useSelector((store) => store.login);

  const dispatch = useDispatch();

  const sweepSpace = useCallback((event) => {
    if (utils.spaceClickInvalid(event)) return;
    const [y, x] = utils.getCoordinates(event);
    webSocket.send(JSON.stringify({
      type: WS.REQ_SWEEP,
      data: { y, x, player: player.name },
    }));
  });

  const flagSpace = useCallback((event) => {
    if (utils.spaceClickInvalid(event)) return;
    const [y, x] = utils.getCoordinates(event);
    webSocket.send(JSON.stringify({
      type: WS.REQ_FLAG,
      data: { y, x, player: player.name },
    }));
  });

  const createSocket = useCallback((url) => {
    const newWebSocket = new WebSocket(url);
    newWebSocket.onmessage = (event) => {
      const { type, data } = JSON.parse(event.data);
      switch (type) {
        case WS.SEND_CURRENT_GAME:
          dispatch(setBoard(data.board));
          dispatch(updateStats(data.stats));
          break;
        case WS.SEND_SWEEP_RESULT:
          if (data.died === player.name) data.stats.status |= FLAGS.DEAD;
          dispatch(updateBoard(data.spaces));
          dispatch(updateStats(data.stats));
          break;
        case WS.SEND_FLAG_RESULT:
          dispatch(updateStats(data.stats));
          dispatch(updateBoard(data.spaces));
          break;
        case WS.SEND_GAME_STATS:
          dispatch(updateStats(data.stats));
          break;
        case WS.SEND_USER:
          dispatch(setPlayer(data.player));
          break;
        default:
          break;
      }
    };
    newWebSocket.onopen = () => {
      newWebSocket.send(JSON.stringify({
        type: WS.REQ_CURRENT_GAME,
      }));
      console.log('sending message to: ', `${server.env.SOCKET}/game`, 'with message: ', WS.REQ_CURRENT_GAME);
      dispatch(setGameJoined(true));
    };
    console.log(newWebSocket);
    dispatch(createWebSocket(newWebSocket));
  });

  const joinGame = useCallback(() => {
    createSocket(`${server.env.SOCKET}/game`);
  });

  useEffect(() => {
    setMounted(true);
    axios.post('/session', { session: utils.getSession() }, { baseURL: server.env.URL })
      .then((response) => {
        const newUser = response.data;
        if (newUser !== null) dispatch(setPlayer(newUser));
        console.log(newUser);
      }).catch(() => {
        console.log('Session error');
      }).finally(() => dispatch(setSessionAttempted()));
  }, [mounted]);

  return (
    <div className="app">
      {player.name === undefined ? <Login /> : gameJoined ? '' : <button type="button" onClick={joinGame}>Join Game</button>}
      <div className="game-holder">
        <StatusBoard
          mineCount={minesLeft}
          safeCount={clearLeft}
          timer={timer}
          deaths={deaths}
          status={status}
          flags={flagCount}
        />
        <Board board={board} onSpaceClick={sweepSpace} onSpaceFlag={flagSpace} />
      </div>
      <PlayerList playerList={playerList} />
    </div>
  );
};

export default App;
