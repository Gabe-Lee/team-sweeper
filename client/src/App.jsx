import React from 'react';
import axios from 'axios';
import Board from './Board';
import Login from './Login';
import { server } from '../../env';
import PlayerList from './PlayerList';
import StatusBoard from './StatusBoard';
import WS from '../../server/actions';

export default class App extends React.Component {
  constructor() {
    super();
    this.state = {
      board: [],
      user: null,
      mineCount: 0,
      safeCount: 0,
      timer: 0,
      deaths: 0,
      flags: 0,
      status: 'NO GAME',
      player: {},
      playerList: {},
    };

    this.onSpaceClick = (event) => {
      if (event.target.disabled || !event.target.dataset || !event.target.dataset.coord) return;
      this.start = Date.now(); // PERFORMANCE CHECK !!!!!!!!!!!!!!!!
      const [y, x] = event.target.dataset.coord.split('_').map((num) => Number(num));
      this.gameSocket.send(JSON.stringify({
        type: WS.REQ_SWEEP,
        data: { y, x, player: this.state.player.name },
      }));
    };

    this.onSpaceFlag = (event) => {
      if (event.target.disabled) return;
      const [y, x] = event.target.dataset.coord.split('_').map((num) => Number(num));
      this.gameSocket.send(JSON.stringify({
        type: WS.REQ_FLAG,
        data: { y, x, player: this.state.player.name },
      }));
    };

    this.onLoginSubmit = (event) => {
      const name = event.target.parentNode.childNodes[1].value;
      const password = event.target.parentNode.childNodes[2].value;
      const password2 = event.target.parentNode.childNodes[3].value;
      if (password !== password2) return;
      axios.post('/login', { name, password }, {
        baseURL: server.env.URL,
      }).then((response) => {
        console.log(response.data);
        window.localStorage.setItem('session', response.data.session);
      }).catch(() => console.log('login error'))
    };

    // this.gameSocket.onmessage = (event) => {
    //   const message = JSON.parse(event.data);
    //   if (message.type === WS.SEND_CURRENT_GAME) {
    //     const { board, mineCount, safeCount, timer, deaths, playerList } = message.data;
    //     this.setState({ board, mineCount, safeCount, timer, deaths, playerList });
    //   } else if (message.type === WS.SEND_SWEEP_RESULT) {
    //     const { spaces, safeCount, mineCount, deaths, died } = message.data;
    //     let { status, player } = this.state;
    //     const newBoard = this.state.board.slice();
    //     for (let i = 0; i < spaces.length; i += 1) {
    //       newBoard[spaces[i].y][spaces[i].x] = spaces[i].space;
    //     }
    //     this.setState({ board: newBoard, safeCount, mineCount, deaths, status });
    //   } else if (message.type === WS.SEND_FLAG_RESULT) {
    //     const { x, y, space } = message.data;
    //     const newBoard = this.state.board.slice();
    //     newBoard[y][x] = space;
    //     this.setState({ board: newBoard });
    //   } else if (message.type === WS.SEND_GAME_STATS) {
    //     let { timer, status, playerList } = message.data;
    //     this.setState({ timer, status, playerList });
    //   } else if (message.type === WS.SEND_USER) {
    //     let newPlayer = message.data.user;
    //     this.setState({ player: newPlayer });
    //   }
    // };
  }

  componentDidMount() {
    axios.post('/session', { session: window.localStorage.getItem('session') },
      {
        baseURL: server.env.URL,
      }).then((response) => {
        this.setState({
          user: response.data,
        });
        this.createSocket();
        console.log(response.data);
      }).catch(() => {
        console.log('Session error');
      });
  }

  createSocket() {
    this.gameSocket = new WebSocket(server.env.SOCKET);
    this.gameSocket.onmessage = (event) => {
      const { type, data } = JSON.parse(event.data);
      switch (type) {
        case WS.SEND_CURRENT_GAME:
          this.setState(message.data);
          break;
        default:
          break;
        // case WS.SEND_SWEEP_RESULT:
        //   const { spaces, safeCount, mineCount, deaths, died } = message.data;
        //   let { status, player } = this.state;
        //   const newBoard = this.state.board.slice();
        //   for (let i = 0; i < spaces.length; i += 1) {
        //     newBoard[spaces[i].y][spaces[i].x] = spaces[i].space;
        //   }
        //   this.setState({ board: newBoard, safeCount, mineCount, deaths, status });
        //   break;
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
  }

  render() {
    const {
      board, mineCount, safeCount, timer, deaths, status, player, playerList, flags,
    } = this.state;
    return (
      <div className="app">
        {player.name === undefined ? <Login onLoginSubmit={this.onLoginSubmit} /> : ''}
        <div className="game-holder">
          <StatusBoard mineCount={mineCount} safeCount={safeCount} timer={timer} deaths={deaths} status={status} flags={flags} />
          <Board board={board} onSpaceClick={this.onSpaceClick} onSpaceFlag={this.onSpaceFlag} />
        </div>
        <PlayerList playerList={playerList} />
      </div>
    );
  }
}
