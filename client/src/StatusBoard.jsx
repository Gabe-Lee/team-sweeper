import React, { PureComponent } from 'react';

export default class StatusBoard extends PureComponent {
  render() {
    const { mineCount, safeCount, timer, deaths, status, flags } = this.props;
    return (
      <div className="status-board">
        <div className="mines">Mines: {mineCount}</div>
        <div className="safes">Safes: {safeCount}</div>
        <div className="status">{status}</div>
        <div className="deaths">Deaths: {deaths}</div>
        <div className="flags">Flags: {flags}</div>
        <div className="timer">{timer < 0 ? 'Next Game: ' : 'Time Left: '}{timer}</div>
      </div>
    );
  }
}
