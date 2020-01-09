import React from 'react';
import axios from 'axios';
import Board from './Board';
import { local } from '../../env';

export default class App extends React.Component {
  state = {
    board: [],
    mineCount: 0,
    safeCount: 0,
    timer: 0,
    ended: 0
  };

  onSpaceClick = (event) => {
    this.start = Date.now();
    const [y, x] = event.currentTarget.dataset.coord.split('_').map((num) => Number(num));
    this.socket.send(JSON.stringify({
      type: 'SWEEP',
      data: {y, x, player: 'dev'},
    }))
  }

  componentDidMount() {
    this.socket = new WebSocket(`${local.env.SOCKET}/game`);
    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (message.type === 'CURRENT_GAME') {
        const { board, mineCount, safeCount, timer } = message.data;
        this.setState({ board, mineCount, safeCount, timer });
      } else if (message.type === 'SWEPT') {
        const { x, y, space, safeCount } = message.data;
        const newBoard = this.state.board.slice();
        newBoard[y][x] = space;
        /*
        MAJOR SLOWDOWN DURING THE SET STATE (REDRAWING EVERY SPACE WHEN ONE SPACE UPDATES!!!!!)
        */
        console.log('Time before setState:',Date.now() - this.start,'ms')
        this.setState({ board: newBoard, safeCount}, () => {console.log('Time AFTER setState:',Date.now() - this.start,'ms')});
      }
    }
  }

  componentDidUpdate() {
    console.log('updated')
  }

  render() {
    const {
      board,
    } = this.state;
    return (
      <div className="app">
        <Board board={board} onSpaceClick={this.onSpaceClick} />
      </div>
    );
  }
}
