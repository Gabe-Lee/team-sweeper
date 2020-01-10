import React, { PureComponent } from 'react';

export default class PlayerList extends PureComponent {
  render() {
    const { playerList } = this.props;
    const names = Object.keys(playerList);
    return (
      <div className="player-list">
        <div className="header">Connected Players</div>
        {names.map((name) => (
          <div className="player-row">
            <div className="alive">{playerList[name].alive}</div>
            <div className="name">{name}</div>
            <div className="score">{playerList[name].score}</div>
          </div>
        ))}
      </div>
    );
  }
}
