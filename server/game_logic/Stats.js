module.exports = class Stats {
  constructor({ mode = '', sweeps = 0, deaths = 0, duration = 0 }) {
    this.mode = mode;
    this.sweeps = sweeps;
    this.deaths = deaths;
    this.duration = duration;
  }
};
