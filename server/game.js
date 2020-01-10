const { MersenneTwister19937, bool } = require('random-js');

const randEngine = MersenneTwister19937.autoSeed();

class SweeperGame {
  constructor(size = 20, density = 25, timer = 1000) {
    this.timer = timer;
    this.size = Math.max(size, 1);
    this.density = Math.min(Math.max(density, 1), 99);
    this.board = [];
    this.visible = [];
    this.flags = [];
    this.deaths = 0;
    this.players = {}
    this.mineCount = 0;
    this.status = 'IN PROGRESS';
    this.safeCount = size * size;
    this.randDist = bool(density, 100);
    this.randBool = () => this.randDist(randEngine);
    for (let y = 0; y < this.size; y += 1) {
      this.board.push([]);
      this.visible.push([]);
      this.flags.push([]);
      for (let x = 0; x < this.size; x += 1) {
        let hasMine = this.randBool();
        this.mineCount += hasMine ? 1 : 0;
        this.safeCount -= hasMine ? 1 : 0;
        this.board[y].push(hasMine ? -3 : 0);
        this.visible[y].push(false);
        this.flags[y].push({ players: [], total: 0 });
      }
    }
    const edgeStarts = [];
    const centerStarts = [];
    const singleStarts = [];
    for (let y = 0; y < this.size; y += 1) {
      for (let x = 0; x < this.size; x += 1) {
        if (this.board[y][x] !== -3) {
          for (let n = 0; n < SweeperGame.neighbors.length; n += 1) {
            const yy = y + SweeperGame.neighbors[n][0];
            const xx = x + SweeperGame.neighbors[n][1];
            if (xx >= 0 && xx < this.size && yy >= 0 && yy < this.size && this.board[yy][xx] === -3) {
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
    let start = [0, 0];
    if (edgeStarts.length > 0) {
      start = edgeStarts[Math.floor(Math.random() * edgeStarts.length)];
    } else if (centerStarts > 0) {
      start = centerStarts[Math.floor(Math.random() * centerStarts.length)];
    } else if (singleStarts > 0) {
      start = singleStarts[Math.floor(Math.random() * singleStarts.length)];
    }
    let spaces = [{y: start[0], x: start[1]}]
    spaces = spaces.concat(this.recursiveSweep(spaces, {[`${start[0]}_${start[1]}`]: true}));
    for (let i = 0; i < spaces.length; i += 1) {
      this.visible[spaces[i].y][spaces[i].x] = true;
      this.safeCount -= 1;
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

  recursiveSweep(children = [], swept = {}) {
    if (children.length === 0) return [];
    let recurseChildren = [];
    let sweepChildren = [];
    for (let i = 0; i < children.length; i += 1) {
      const {y, x} = children[i];
      for (let n = 0; n < SweeperGame.neighbors.length; n += 1) {
        const yy = y + SweeperGame.neighbors[n][0];
        const xx = x + SweeperGame.neighbors[n][1];
        if (yy >= 0 && yy < this.size && xx >= 0 && xx < this.size && this.board[yy][xx] !== -3 && swept[`${yy}_${xx}`] === undefined) {
          sweepChildren.push({y: yy, x: xx, space: this.board[yy][xx]});
          swept[`${yy}_${xx}`] = true;
          if (this.board[yy][xx] === 0) {
            recurseChildren.push({y: yy, x: xx, space: this.board[yy][xx]});
          }
        }
      }
    }
    sweepChildren = sweepChildren.concat(this.recursiveSweep(recurseChildren, swept));
    return sweepChildren;
  }

  sweepPosition(y, x, player = 'anon') {
    if (
        this.status === 'GAME OVER' ||
        this.status === 'GAME CLEAR' ||
        this.status === 'TIME OUT' ||
        !this.playerIsAlive(player)
      ) return { spaces: [] };
    const wasMine = this.board[y][x] === -3;
    if (wasMine) {
      this.players[player] = false;
      this.mineCount -= 1;
      this.deaths += 1;
      if (this.deaths >= 64) {
        this.status = "GAME OVER";
        this.timer = 0;
      }
    }
    let spaces = [{y, x, space: this.board[y][x]}];
    if (!wasMine && this.board[y][x] === 0) {
      spaces = spaces.concat(this.recursiveSweep(spaces, {[`${y}_${x}`]: true}))
    }
    for (let i = 0; i < spaces.length; i += 1) {
      this.visible[spaces[i].y, spaces[i].x] = true;
      this.safeCount -= 1;
      if (this.safeCount <= 0) {
        this.safeCount === 0;
        this.status = 'GAME CLEAR';
        this.timer = 0;
      }
    }
    return { spaces, safeCount: this.safeCount, mineCount: this.mineCount, deaths: this.deaths, died: this.players[player] ? '' : player };
  }

  flagPosition(y, x, player = 'anon') {
    if (!this.playerIsAlive(player)) return -1;
    const old = this.flags[y][x].total > 0;
    this.flags[y][x].players[player] = this.flags[y][x].players[player] === undefined ? true : !this.flags[y][x].players[player];
    this.flags[y][x].total += this.flags[y][x].players[player] ? 1 : -1;
    return { newFlag: this.flags[y][x].total > 0 !== old, status: this.flags[y][x].total > 0 };
  }

  getVisibleBoard() {
    const visBoard = []
    for (let y = 0; y < this.size; y += 1) {
      visBoard[y] = [];
      for (let x = 0; x < this.size; x += 1) {
        if (this.visible[y][x]) {
          visBoard[y][x] = this.board[y][x];
        } else if (this.flags[y][x].total > 0) {
          visBoard[y][x] = -2;
        } else {
          visBoard[y][x] = -1;
        }
      }
    }
    return visBoard;
  }

  getHiddenBoard() {
    return this.board;
  }
}

module.exports = SweeperGame;
