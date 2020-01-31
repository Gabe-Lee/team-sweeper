/* eslint-disable no-nested-ternary */
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
  createWebSocket, setBoard, updateBoard, updateStats, setPlayer, setSessionAttempted, setGameJoined, updateFlags, setMyFlags
} from './redux/actions';
import { STATUS } from '../../server/game_logic/Game';

const App = () => {
  const [mounted, setMounted] = useState(false);

  const board = useSelector((store) => store.board);
  const player = useSelector((store) => store.player);
  const playerList = useSelector((store) => store.playerList);
  const webSocket = useSelector((store) => store.webSocket);
  const { gameJoined, session } = useSelector((store) => store.login);

  const dispatch = useDispatch();

  const sweepSpace = useCallback((event) => {
    if (utils.spaceClickInvalid(event)) return;
    const [y, x] = utils.getCoordinates(event);
    webSocket.send(JSON.stringify({
      type: WS.REQ_SWEEP,
      session,
      data: { y, x },
    }));
  });

  const flagSpace = useCallback((event) => {
    if (utils.spaceClickInvalid(event)) return;
    const [y, x] = utils.getCoordinates(event);
    webSocket.send(JSON.stringify({
      type: WS.REQ_FLAG,
      session,
      data: { y, x },
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
          dispatch(updateBoard(data.spaces));
          dispatch(updateStats(data.stats));
          break;
        case WS.SEND_FLAG_RESULT:
          dispatch(updateStats(data.stats));
          dispatch(updateFlags(data.flag));
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
        session,
      }));
      console.log('sending message to: ', `${server.env.SOCKET}/game`, 'with message: ', WS.REQ_CURRENT_GAME);
      dispatch(setGameJoined(true));
    };
    console.log(newWebSocket);
    dispatch(createWebSocket(newWebSocket));
  });

  const joinGame = useCallback((event) => {
    createSocket(`${server.env.SOCKET}/game/${event.target.dataset.mode}`);
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
      {
        player.name === undefined ? <Login />
          : gameJoined ? (
            <>
              <div className="game-holder">
                <StatusBoard />
                <Board onSpaceClick={sweepSpace} onSpaceFlag={flagSpace} />
              </div>
              <PlayerList playerList={playerList} />
            </>
          )
            : (
              <>
                <h2>Join Game</h2>
                <button type="button" onClick={joinGame} data-mode="easy">Easy</button>
                <button type="button" onClick={joinGame} data-mode="medium">Medium</button>
                <button type="button" onClick={joinGame} data-mode="hard">Hard</button>
              </>
            )
      }

    </div>
  );
};

export default App;
