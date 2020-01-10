import React, { PureComponent } from 'react';

export default class PlayerList extends PureComponent {
  render() {
    const { playerList } = this.props;
    const names = Object.keys(playerList || {});
    return (
      <div className="player-list">
        <div className="header">Players</div>
        {names.sort((a, b) => (playerList[a].score > playerList[b].score) ? 1 : -1 ).map((name) => (
          <div className="player-row">
            <div className={playerList[name].alive ? 'status alive' : 'status dead'}>{playerList[name].alive ? '✔' : '☠' }</div>
            <div className="name">{name}</div>
            <div className="score">{playerList[name].score}</div>
          </div>
        ))}
      </div>
    );
  }
}
