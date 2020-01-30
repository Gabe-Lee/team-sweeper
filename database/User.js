const Player = require('../server/game_logic/Player');

module.exports = class User extends Player {
  constructor({ _id, hash, ...playerArgs }) {
    super(playerArgs);
    this._id = _id;
    this.hash = hash;
  }

  getPlayer() {
    return new Player(this);
  }
};
