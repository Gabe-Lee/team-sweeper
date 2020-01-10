import React from 'react';
import axios from 'axios';
import Board from './Board';
import NameEntry from './NameEntry';
import { local } from '../../env';
import PlayerList from './PlayerList';

export default class App extends React.Component {
  constructor() {
    super();
    this.state = {
      board: [],
      mineCount: 0,
      safeCount: 0,
      timer: 0,
      deaths: 0,
      status: 'NO GAME',
      player: '',
      playerList: {},
    };

    this.onSpaceClick = (event) => {
      if (event.target.disabled) return;
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

    this.onNameSubmit = (event) => {
      const player = event.target.parentNode.childNodes[0].value;
      this.setState({ player });
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
        console.log(message.data);
        let { status, player } = this.state;
        if (died === player) {
          status = 'YOU DIED';
        }
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
        if (status === 'IN PROGRESS' && this.state.status === 'YOU DIED') {
          status === 'YOU DIED';
        }
        this.setState({ timer, status });
      } 
    };
  }

  render() {
    const {
      board, mineCount, safeCount, timer, deaths, status, player, playerList,
    } = this.state;
    return (
      <div className="app">
        {player === '' ? <NameEntry onNameSubmit={this.onNameSubmit} /> : '' }
        <div className="game-holder">
          <div>{`Mines Left: ${mineCount}, Safe Spaces Left: ${safeCount}, Time Left: ${timer}, Deaths: ${deaths}, Status: ${status}`}</div>
          <Board board={board} onSpaceClick={this.onSpaceClick} onSpaceFlag={this.onSpaceFlag} />
        </div>
        <PlayerList playerList={playerList} />
      </div>
    );
  }
}
