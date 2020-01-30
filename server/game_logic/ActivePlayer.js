const Player = require('./Player');
const Stats = require('./Stats');

module.exports = class ActivePlayer extends Player {
  constructor({ lives = 3, sweeps = 0, duration = 0, ...playerArgs }) {
    super(playerArgs);
    this.lives = lives;
    this.sweeps = sweeps;
    this.duration = duration;
  }

  addSweep(mode, amount = 1) {
    this.sweeps += amount;
    this.checkMode(mode);
    this.modes[mode].sweeps += amount;
  }

  loseLife(mode, amount = 1) {
    this.lives -= amount;
    this.checkMode(mode);
    this.modes[mode].deaths += amount;
  }

  countTime(mode, amount = 1000) {
    this.duration += amount;
    this.checkMode(mode);
    this.modes[mode].duration += amount;
  }

  checkMode(mode) {
    if (this.modes[mode] === undefined) {
      this.modes[mode] = new Stats({ mode });
    }
  }
};
