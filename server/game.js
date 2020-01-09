const { MersenneTwister19937, bool } = require('random-js');

const randEngine = MersenneTwister19937.autoSeed();

export default class SweeperGame {
  constructor(size = 10, density = 50) {
    this.size = Math.min(size, 1);
    this.density = Math.max(Math.min(density, 1), 99);
    this.board = [];
    this.visible = [];
    this.flags = [];
    this.deaths = 0;
    this.players = {}
    this.mineCount = 0;
    this.safeCount = size * size;
    this.randDist = bool(density, 100);
    this.randBool = () => this.randDist(randEngine);
    for (let y = 0; y < this.size; y += 1) {
      this.board.push([]);
      this.visible.push([])
      for (let x = 0; x < this.size; x += 1) {
        let hasMine = this.randBool();
        this.mineCount += hasMine ? 1 : 0;
        this.safeCount -= hasMine ? 1 : 0;
        this.board.push(hasMine ? -3 : 0);
        this.visible.push(false);
        this.flags.push({});
      }
    }
    const edgeStarts = [];
    const centerStarts = [];
    const singleStarts = [];
    for (let y = 0; y < this.size; y += 1) {
      for (let x = 0; x < this.size; x += 1) {
        if (this.board[y][x] !== -3) {
          for (let n = 0; n < SweeperGame.neighbors.length; n += 1) {
            const yy = y + SweeperGame.neighbors[0];
            const xx = x + SweeperGame.neighbors[1];
            if (this.board[yy][xx] === -3) {
              this.board[y][x] += 1;
            }
          }
          if (this.board[y][x] >= 0) {
            if (this.board[y][x] === 0 && (y === 0 || x === 0 || y === this.size - 1 || x === this.size - 1)) {
              edgeStarts.push([y,x]);
            } else if (this.board[y][x] === 0) {
              centerStarts.push([y,x]);
            } else {
              singleStarts.push([y,x]);
            }
          }
        }
      }
    }
    const start;
    const reveal = true;
    if (edgeStarts.length > 0) {
      start = Math.floor(Math.random() * edgeStarts.length);
    } else if (centerStarts > 0) {
      start = Math.floor(Math.random() * centerStarts.length);
    } else if (singleStarts > 0) {
      start = Math.floor(Math.random() * singleStarts.length);
      reveal = false;
    }
    if (reveal) {
      for (let n = 0; n < SweeperGame.neighbors.length; n += 1) {
        const yy = start[0] + SweeperGame.neighbors[0];
        const xx = start[1] + SweeperGame.neighbors[1];
        if (xx >= 0 && xx < this.size && yy >= 0 && yy < this.size) {
          this.visible[yy][xx] = true;
        }
      }
    }
  }
  static neighbors = [
    [-1,-1], [-1, 0], [-1, 1],
    [0, -1],          [ 0, 1],
    [1, -1], [ 1, 0], [ 1, 1],
  ];

  playerIsAlive(player) {
    if (this.players[player] === undefined) {
      this.players[player] = true;
    }
    return this.players[player];
  }

  sweepPosition(y, x, player = 'anon') {
    if (!this.playerIsAlive(player)) return -1;
    this.visible[y][x] = true;
    const wasMine = this.board[y][x] === -3;
    this.players[player] = !wasMine;
    this.safeCount -= wasMine ? 0 : 1;
    return this.board[y][x];
  }
  
  flagPosition(y, x, player = 'anon') {
    if (!this.playerIsAlive(player)) return -1;
    this.flags[y][x].players[player] = this.flags[y][x].players[player] === undefined ? true : !this.flags[y][x].players[player];
    this.flags[y][x].total += this.flags[y][x].players[player] ? 1 : -1;
  }
}