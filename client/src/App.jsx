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
    };

    this.onSpaceClick = (event) => {
      if (event.target.disabled) return;
      this.start = Date.now(); // PERFORMANCE CHECK !!!!!!!!!!!!!!!!
      const [y, x] = event.target.dataset.coord.split('_').map((num) => Number(num));
      this.socket.send(JSON.stringify({
        type: 'SWEEP',
        data: { y, x, player: 'dev' },
      }));
    };

    this.onSpaceFlag = (event) => {
      if (event.target.disabled) return;
      const [y, x] = event.target.dataset.coord.split('_').map((num) => Number(num));
      this.socket.send(JSON.stringify({
        type: 'FLAG',
        data: { y, x, player: 'dev' },
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
        const { spaces, safeCount, mineCount } = message.data;
        const newBoard = this.state.board.slice();
        for (let i = 0; i < spaces.length; i += 1) {
          newBoard[spaces[i].y][spaces[i].x] = spaces[i].space;
        }
        /*
        MAJOR SLOWDOWN DURING THE SET STATE (REDRAWING EVERY SPACE WHEN ONE SPACE UPDATES!!!!!)
        */
        console.log('Time before setState:',Date.now() - this.start,'ms')
        this.setState({ board: newBoard, safeCount, mineCount }, () => {console.log('Time AFTER setState:',Date.now() - this.start,'ms')});
      } else if (message.type === 'FLAGGED') {
        const { x, y, space } = message.data;
        const newBoard = this.state.board.slice();
        newBoard[y][x] = space;
        /*
        MAJOR SLOWDOWN DURING THE SET STATE (REDRAWING EVERY SPACE WHEN ONE SPACE UPDATES!!!!!)
        */
        console.log('Time before setState:',Date.now() - this.start,'ms')
        this.setState({ board: newBoard }, () => {console.log('Time AFTER setState:',Date.now() - this.start,'ms')});
      }
    } 
  }

  render() {
    const {
      board, mineCount, safeCount, timer,
    } = this.state;
    return (
      <div className="app">
        <div>{`Mines Left: ${mineCount}, Safe Spaces Left: ${safeCount}, Time Left: ${Math.floor(timer / 1000)}`}</div>
        <Board board={board} onSpaceClick={this.onSpaceClick} onSpaceFlag={this.onSpaceFlag} />
      </div>
    );
  }
}
