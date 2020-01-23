/* eslint-disable no-case-declarations */
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import Board from './Board';
import Login from './Login';
import { server } from '../../env';
import PlayerList from './PlayerList';
import StatusBoard from './StatusBoard';
import WS from '../../server/actions';
import { createWebSocket, setBoard, setStats } from './redux/actions';
const App = () => {
  const board = useSelector((store) => store.board);
  const player = useSelector((store) => store.player);
  const playerList = useSelector((store) => store.playerList);
  const {
    minesLeft, clearLeft, timer, status, deaths, flagCount,
  } = useSelector((store) => store.stats);
  const webSocket = useSelector((store) => store.webSocket);

  const dispatch = useDispatch();

  const [onSpaceClick] = useState((event) => {
    if (App.spaceClickInvalid(event)) return;
    const [y, x] = App.getCoordinates(event);
    webSocket.send(JSON.stringify({
      type: WS.REQ_SWEEP,
      data: { y, x, player: player.name },
    }));
  });
  const [onSpaceFlag] = useState((event) => {
    if (App.spaceClickInvalid(event)) return;
    const [y, x] = App.getCoordinates(event);
    webSocket.send(JSON.stringify({
      type: WS.REQ_FLAG,
      data: { y, x, player: player.name },
    }));
  });
  const [onLoginSubmit] = useState((event) => {
    const { name, password, password2 } = App.getLoginFields(event);
    if (password !== password2) return;
    axios.post('/login', { name, password }, {
      baseURL: server.env.URL,
    }).then((response) => {
      const uuid = response.data.session;
      console.log('login session: ', uuid);
      App.setSession(uuid);
    }).catch(() => console.log('login error'));
  });
  const [createSocket] = useState((url) => {
    const newWebSocket = new WebSocket(url);
    newWebSocket.onmessage = (event) => {
      const { type, data } = JSON.parse(event.data);
      switch (type) {
        case WS.SEND_CURRENT_GAME:
          const { newBoard, ...newStats } = data;
          dispatch(setBoard(newBoard));
          dispatch(updateStats(newStats));
          break;
        default:
          break;
        case WS.SEND_SWEEP_RESULT:
          const { spaces: changes, died, ...stats } = data;
          dispatch(updateBoard(spaces));
          dispatch(updateStats(stats));
          if (died === player.name) dispatch(updateStats)
          break;
        // case WS.SEND_FLAG_RESULT:
        //   const { x, y, space } = message.data;
        //   const newBoard = this.state.board.slice();
        //   newBoard[y][x] = space;
        //   this.setState({ board: newBoard });
        //   break;
        // case WS.SEND_GAME_STATS:
        //   let { timer, status, playerList } = message.data;
        //   this.setState({ timer, status, playerList });
        //   break;
        // case WS.SEND_USER:
        //   let newPlayer = message.data.user;
        //   this.setState({ player: newPlayer });
      }
    };
    dispatch(createWebSocket(newWebSocket));
  });

  useEffect(() => {
    axios.post('/session', { session: App.getSession() }, { baseURL: server.env.URL })
      .then((response) => {
        const newUser = response.data;
        if (newUser !== null) setUser(newUser);
        console.log(newUser);
      }).catch(() => {
        console.log('Session error');
      });
  });

  return (
    <div className="app">
      {user.name === undefined ? <Login onLoginSubmit={onLoginSubmit} /> : ''}
      <div className="game-holder">
        <StatusBoard
          mineCount={mineCount}
          safeCount={safeCount}
          timer={timer}
          deaths={deaths}
          status={status}
          flags={flags}
        />
        <Board board={board} onSpaceClick={onSpaceClick} onSpaceFlag={onSpaceFlag} />
      </div>
      <PlayerList playerList={playerList} />
    </div>
  );
};
App.getSession = () => window.localStorage.getItem('session');
App.setSession = (uuid) => window.localStorage.setItem('session', uuid);
App.spaceClickInvalid = (e) => e.target.disabled || !e.target.dataset || !e.target.dataset.coord;
App.getCoordinates = (e) => e.target.dataset.coord.split('_').map((num) => Number(num));
App.getLoginFields = (e) => ({
  name: e.target.parentNode.childNodes[1].value,
  password: e.target.parentNode.childNodes[2].value,
  password2: e.target.parentNode.childNodes[3].value,
});
export default App;
