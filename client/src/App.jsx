import React from 'react';
import axios from 'axios';
import Board from './Board';
import Login from './Login';
import { local } from '../../env';
import PlayerList from './PlayerList';
import StatusBoard from './StatusBoard';

export default class App extends React.Component {
  constructor() {
    super();
    this.state = {
      board: [],
      mineCount: 0,
      safeCount: 0,
      timer: 0,
      deaths: 0,
      flags: 0,
      status: 'NO GAME',
      player: '',
      playerList: {},
    };

    this.onSpaceClick = (event) => {
      if (event.target.disabled || !event.target.dataset || !event.target.dataset.coord) return;
      this.start = Date.now(); // PERFORMANCE CHECK !!!!!!!!!!!!!!!!
      const [y, x] = event.target.dataset.coord.split('_').map((num) => Number(num));
      this.socket.send(JSON.stringify({
        type: 'SWEEP',
        data: { y, x, player: this.state.player },
      }));
    };

    this.onSpaceFlag = (event) => {
      if (event.target.disabled) return;
      const [y, x] = event.target.dataset.coord.split('_').map((num) => Number(num));
      this.socket.send(JSON.stringify({
        type: 'FLAG',
        data: { y, x, player: this.state.player },
      }));
    };

    this.onLoginSubmit = (event) => {
      const name = event.target.parentNode.childNodes[0].value;
      const password = event.target.parentNode.childNodes[1].value;
      console.log('info:',name, password)
      this.socket.send(JSON.stringify({
        type: 'LOGIN',
        data: { name, password },
      }));
    };
  }

  componentDidMount() {
    this.socket = new WebSocket(`${local.env.SOCKET}/game`);
    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'CURRENT_GAME') {
        const { board, mineCount, safeCount, timer, deaths, playerList } = message.data;
        this.setState({ board, mineCount, safeCount, timer, deaths, playerList });
      } else if (message.type === 'SWEPT') {
        const { spaces, safeCount, mineCount, deaths, died } = message.data;
        let { status, player } = this.state;
        const newBoard = this.state.board.slice();
        for (let i = 0; i < spaces.length; i += 1) {
          newBoard[spaces[i].y][spaces[i].x] = spaces[i].space;
        }
        this.setState({ board: newBoard, safeCount, mineCount, deaths, status });
      } else if (message.type === 'FLAGGED') {
        const { x, y, space } = message.data;
        const newBoard = this.state.board.slice();
        newBoard[y][x] = space;
        this.setState({ board: newBoard });
      } else if (message.type === 'TICK_TIME') {
        let { timer, status, playerList } = message.data;
        this.setState({ timer, status, playerList });
      } 
    };
  }

  render() {
    const {
      board, mineCount, safeCount, timer, deaths, status, player, playerList, flags,
    } = this.state;
    return (
      <div className="app">
        {player === '' ? <Login onLoginSubmit={this.onLoginSubmit} /> : '' }
        <div className="game-holder">
          <StatusBoard mineCount={mineCount} safeCount={safeCount} timer={timer} deaths={deaths} status={status} flags={flags} />
          <Board board={board} onSpaceClick={this.onSpaceClick} onSpaceFlag={this.onSpaceFlag} />
        </div>
        <PlayerList playerList={playerList} />
      </div>
    );
  }
}
