import React from 'react';
import { useSelector } from 'react-redux';
import { FLAGS } from '../../server/game';

const STATUS = {
  [FLAGS.NONE]: 'NO GAME',
  [FLAGS.DEAD]: 'DEAD',
  [FLAGS.TIMEOUT]: 'TIME OVER',
  [FLAGS.CLEARED]: 'CLEARED',
  [FLAGS.ALLDEAD]: 'ALL DEAD',
};

const StatusBoard = () => {
  const {
    minesLeft, clearLeft, status, deaths, timer, flagCount,
  } = useSelector((store) => store.stats);
  return (
    <div className="status-board">
      <div className="mines">{`Mines: ${minesLeft}`}</div>
      <div className="safes">{`Safes: ${clearLeft}`}</div>
      <div className="status">{STATUS[status]}</div>
      <div className="deaths">{`Deaths: ${deaths}`}</div>
      <div className="flags">{`Flags: ${flagCount}`}</div>
      <div className="timer">{`${timer < 0 ? 'Next Game: ' : 'Time Left: '} ${timer}`}</div>
    </div>
  );
};
export default StatusBoard;
