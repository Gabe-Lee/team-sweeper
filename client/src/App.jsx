import React from 'react';
import axios from 'axios';
import Board from './Board';
import { local } from '../../env';

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
      player: 'DEV',
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
  }

  componentDidMount() {
    this.socket = new WebSocket(`${local.env.SOCKET}/game`);
    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'CURRENT_GAME') {
        const { board, mineCount, safeCount, timer } = message.data;
        this.setState({ board, mineCount, safeCount, timer });
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
        /*
        MAJOR SLOWDOWN DURING THE SET STATE (REDRAWING EVERY SPACE WHEN ONE SPACE UPDATES!!!!!)
        */
        console.log('Time before setState:',Date.now() - this.start,'ms')
        this.setState({ board: newBoard, safeCount, mineCount, deaths, status }, () => {console.log('Time AFTER setState:',Date.now() - this.start,'ms')});
      } else if (message.type === 'FLAGGED') {
        const { x, y, space } = message.data;
        const newBoard = this.state.board.slice();
        newBoard[y][x] = space;
        /*
        MAJOR SLOWDOWN DURING THE SET STATE (REDRAWING EVERY SPACE WHEN ONE SPACE UPDATES!!!!!)
        */
        console.log('Time before setState:',Date.now() - this.start,'ms')
        this.setState({ board: newBoard }, () => {console.log('Time AFTER setState:',Date.now() - this.start,'ms')});
      } else if (message.type === 'TICK_TIME') {
        let { timer, status } = message.data;
        if (status === 'IN PROGRESS' && this.state.status === 'YOU DIED') {
          status === 'YOU DIED';
        }
        /*
        MAJOR SLOWDOWN DURING THE SET STATE (REDRAWING EVERY SPACE WHEN ONE SPACE UPDATES!!!!!)
        */
        this.setState({ timer, status });
      }
    } 
  }

  render() {
    const {
      board, mineCount, safeCount, timer, deaths, status
    } = this.state;
    return (
      <div className="app">
        <div>{`Mines Left: ${mineCount}, Safe Spaces Left: ${safeCount}, Time Left: ${timer}, Deaths: ${deaths}, Status: ${status}`}</div>
        <Board board={board} onSpaceClick={this.onSpaceClick} onSpaceFlag={this.onSpaceFlag} />
      </div>
    );
  }
}
