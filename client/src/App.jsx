import React from 'react';
import axios from 'axios';
import Board from './Board';
import { local } from '../../env';

export default class App extends React.Component {
  state = {
    board: [],
    mines: 0,
    timer: 0,
    ended: 0
  };

  onSpaceClick = (event) => {
    const [y, x] = event.currentTarget.dataset.coord.split('_').map((num) => Number(num));
    console.log(y, x);
    console.log(event);
  }

  componentDidMount() {
    this.socket = new WebSocket(`${local.env.SOCKET}/game`);
    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (message.type === 'NEW_GAME') {
        const board = message.data.board;
        const mines = message.data.mines;
        const timer = message.data.timer;
        const ended = 0;
        this.setState({ board, mines, timer });
      }
    }
  }

  render() {
    const {
      board,
    } = this.state;
    return (
      <div className="app">
        <Board board={board} />
      </div>
    );
  }
}
