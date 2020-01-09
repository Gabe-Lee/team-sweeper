import React from 'react';
import T from 'prop-types';
import Space from './Space';

const Board = ({ board, onSpaceClick, onSpaceFlag }) => (
  <div
    className="board"
    onContextMenu={(e) => {
      e.preventDefault();
      onSpaceFlag(e);
    }}
    style={
      {
        gridTemplateColumns: `repeat(${board[0] ? board[0].length : 0}, 1fr)`,
        gridTemplateRows: `repeat(${board.length}, 1fr)`,
        width: `${(board[0] ? board[0].length : 0) * 1.5}rem`,
        height: `${board.length * 1.5}rem`,
      }
    }
  >
    {board.map((row, y) => row.map((spaceMines, x) => <Space key={`${y}_${x}`} mines={spaceMines} coord={`${y}_${x}`} onSpaceClick={onSpaceClick} />)) }
  </div>
);
Board.propTypes = {
  board: T.arrayOf(T.arrayOf(T.number)).isRequired,
  onSpaceClick: T.func.isRequired,
  onSpaceFlag: T.func.isRequired,
};
export default Board;
