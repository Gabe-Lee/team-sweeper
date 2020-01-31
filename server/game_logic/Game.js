/* eslint-disable no-nested-ternary */
/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-bitwise */
const { MersenneTwister19937, bool } = require('random-js');
const { Matrix } = require('../utils');
const ActivePlayer = require('./ActivePlayer');

const randEngine = MersenneTwister19937.autoSeed();

const STATUS = {
  NO_GAME: 'NO_GAME',
  TIMEOUT: 'TIMEOUT',
  CLEARED: 'CLEARED',
  IN_PROGRESS: 'IN_PROGRESS',
};
const SPACE = {
  MINE: -3,
  FLAG: -2,
  UNKNOWN: -1,
};

class SweeperGame {
  constructor({
    mode = 'medium', size = 30, density = 20, timer = 900,
  }) {
    switch (mode) {
      case 'easy':
        this.mode = 'easy';
        this.density = 10;
        break;
      case 'medium':
        this.mode = 'medium';
        this.density = 20;
        break;
      case 'hard':
        this.mode = 'hard';
        this.density = 30;
        break;
      case 'extreme':
        this.mode = 'extreme';
        this.density = 40;
        break;
      default:
        this.mode = mode;
        this.density = Math.max(1, Math.min(99, density));
        break;
    }
    this.stats = {
      timer,
      deaths: 0,
      minesLeft: 0,
      clearLeft: 0,
      flagCount: 0,
      status: STATUS.IN_PROGRESS,
    };
    this.size = Math.max(1, Math.min(50, size));
    this.board = Matrix(this.size, 0);
    this.visibleBoard = Matrix(this.size, -1);
    this.flags = Matrix(this.size, { owners: {}, total: 0 });
    this.uniqueFlags = 0;
    this.activePlayers = {};
    this.randDist = bool(density, 100);
    this.randBool = () => this.randDist(randEngine);

    // Fill board with mines and calculate surrounding mine counts
    this.forEachSpace((y, x) => {
      const hasMine = this.randBool();
      if (hasMine) {
        this.stats.minesLeft += 1;
        this.board[y][x] = SPACE.MINE;
        this.forEachNeighbor(y, x, (yy, xx) => {
          if (this.board[yy][xx] !== SPACE.MINE) {
            this.board[yy][xx] += 1;
          }
        });
      } else {
        this.stats.clearLeft += 1;
      }
    });

    // Choose a random starting clear space,
    // prefering spaces with the lowest surrounding mines
    const preferedStarts = Array(9).fill([]);
    this.forEachSpace((y, x) => {
      if (this.board[y][x] >= 0) {
        preferedStarts[this.board[y][x]].push([y, x]);
      }
    });
    let start = [0, 0];
    let startChosen = false;
    for (let count = 0; !startChosen && count < 9; count += 1) {
      const startSet = preferedStarts[count];
      if (startSet.length > 0) {
        const index = Math.floor(Math.random() * startSet.length);
        start = startSet[index];
        startChosen = true;
      }
    }

    // Recursively sweep chosen start space and any connected zero-mine spaces
    this.sweepPosition(start[0], start[1], '', true);
  }

  recursiveSweep(children = [], swept = {}) {
    if (children.length === 0) return [];
    const recurseChildren = [];
    const sweepChildren = [];
    for (let i = 0; i < children.length; i += 1) {
      const { y, x } = children[i];
      this.forEachNeighbor(y, x, (yy, xx) => {
        if (!this.spaceIsMine(yy, xx) && !this.spaceHasBeenSwept(yy, xx, swept)) {
          sweepChildren.push({ y: yy, x: xx, value: this.board[yy][xx] });
          swept[`${yy}_${xx}`] = true;
          if (this.spaceHasNoNearbyMines(yy, xx)) {
            recurseChildren.push({ y: yy, x: xx, value: this.board[yy][xx] });
          }
        }
      });
    }
    return sweepChildren.concat(this.recursiveSweep(recurseChildren, swept));
  }

  sweepPosition(y, x, playerName, master = false) {
    if (!this.spacesCanBeModified(playerName, master)) return { spaces: [] };

    let spaces = [{ y, x, value: this.board[y][x] }];
    const activePlayer = this.activePlayers[playerName];

    if (this.spaceIsMine(y, x)) {
      if (!master) {
        activePlayer.loseLife(this.mode);
        this.stats.deaths += 1;
      }
      this.stats.minesLeft -= 1;
    } else {
      if (!master) {
        activePlayer.addSweep(this.mode);
      }
      if (this.spaceHasNoNearbyMines(y, x)) {
        spaces = spaces.concat(this.recursiveSweep(spaces, { [`${y}_${x}`]: true }));
      }
    }

    for (let i = 0, len = spaces.length; i < len; i += 1) {
      const sx = spaces[i].x;
      const sy = spaces[i].y;
      this.visibleBoard[sy][sx] = this.board[sy][sx];
      this.stats.clearLeft -= 1;
      if (this.stats.clearLeft <= 0 || this.stats.minesLeft <= 0) {
        this.stats.clearLeft = 0;
        this.stats.minesLeft = 0;
        this.stats.status = STATUS.CLEARED;
        this.stats.timer = 0;
      }
    }
    return { spaces, stats: this.stats, died: activePlayer === undefined ? '' : activePlayer.lives <= 0 ? '' : playerName };
  }

  flagPosition(y, x, playerName, master = false) {
    console.log(this.flags)
    console.log(this.activePlayers[playerName]);
    if (!this.spacesCanBeModified(playerName, master)) return { spaces: [] };
    console.log('can modify spaces')
    const flagSpace = this.flags[y][x];
    const oldStatus = flagSpace.total > 0;
    this.setOrToggleFlag(y, x, playerName);
    const newStatus = this.flags[y][x].total > 0 !== oldStatus;
    if (newStatus) {
      this.uniqueFlags += flagSpace.total > 0 ? 1 : -1;
    }
    return { newStatus, spaces: [{ y, x, value: this.visibleBoard[y][x] }] };
  }

  forEachNeighbor(y, x, operation = () => { }, map = false) {
    const shifts = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1], [0, 1],
      [1, -1], [1, 0], [1, 1],
    ];
    const output = [];
    for (let s = 0, len = shifts.length; s < len; s += 1) {
      const yy = y + shifts[s][0];
      const xx = x + shifts[s][1];
      if (yy >= 0 && yy < this.size && xx >= 0 && xx < this.size) {
        const result = operation(yy, xx);
        if (map) output.push(result);
      }
    }
    return map ? output : undefined;
  }

  forEachSpace(operation = () => { }, map = false) {
    const limit = this.size;
    const output = [];
    for (let y = 0; y < limit; y += 1) {
      if (map) output.push([]);
      for (let x = 0; x < limit; x += 1) {
        const result = operation(y, x);
        if (map) output[y].push(result);
      }
    }
    return map ? output : undefined;
  }

  gameInProgress() {
    return this.stats.status === STATUS.IN_PROGRESS;
  }

  playerIsAlive(playerName) {
    const player = this.activePlayers[playerName];
    if (player === undefined) return false;
    return player.lives > 0;
  }

  spacesCanBeModified(playerName, master = false) {
    return master || (this.gameInProgress() && this.playerIsAlive(playerName));
  }

  spaceIsMine(y, x) {
    return this.board[y][x] === SPACE.MINE;
  }

  spaceHasNoNearbyMines(y, x) {
    return this.board[y][x] === 0;
  }

  spaceHasBeenSwept(y, x, sweptDict) {
    return sweptDict[`${y}_${x}`] !== undefined;
  }

  setOrToggleFlag(y, x, playerName) {
    const flagSpace = this.flags[y][x];
    if (flagSpace.owners[playerName] === undefined) {
      flagSpace.owners[playerName] = true;
      flagSpace.total += 1;
    } else {
      flagSpace.owners[playerName] = !flagSpace.owners[playerName];
      flagSpace.total += flagSpace.owners[playerName] ? 1 : -1;
    }
    this.visibleBoard[y][x] = flagSpace.total > 0 ? SPACE.FLAG : SPACE.UNKNOWN;
  }

  addPlayer(player) {
    if (this.activePlayers[player.name] === undefined) {
      this.activePlayers[player.name] = new ActivePlayer({
        lives: 3, sweeps: 0, duration: 0, ...player,
      });
    }
  }

  tickTime(duration = 1) {
    const names = Object.keys(this.activePlayers);
    this.stats.timer -= duration;
    if (this.stats.timer <= 0) {
      this.stats.status = STATUS.TIMEOUT;
    }
    for (let i = 0, len = names.length; i < len; i += 1) {
      const player = this.activePlayers[names[i]];
      if (player.lives > 0) {
        player.countTime(this.mode, duration);
      }
    }
  }
}

module.exports = SweeperGame;
module.exports.STATUS = STATUS;
module.exports.SPACE = SPACE;
