/* eslint-disable jsx-a11y/interactive-supports-focus */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { PureComponent } from 'react';
import T from 'prop-types';
import Space from './Space';

export default class Board extends PureComponent {
  render() {
    const { board, onSpaceClick, onSpaceFlag } = this.props;
    return (
      <div
        className="board"
        onContextMenu={(e) => {
          e.preventDefault();
          onSpaceFlag(e);
        }}
        onClick={onSpaceClick}
        role="button"
        style={
            {
              gridTemplateColumns: `repeat(${board[0] ? board[0].length : 0}, 1fr)`,
              gridTemplateRows: `repeat(${board.length}, 1fr)`,
              width: `${(board[0] ? board[0].length : 0) * 1.5}rem`,
              height: `${board.length * 1.5}rem`,
            }
          }
      >
        {board.map((row, y) => row.map((spaceMines, x) => <Space key={`${y}_${x}`} mines={spaceMines} coord={`${y}_${x}`} />)) }
      </div>
    );
  }
}
Board.propTypes = {
  board: T.arrayOf(T.arrayOf(T.number)).isRequired,
  onSpaceClick: T.func.isRequired,
  onSpaceFlag: T.func.isRequired,
};
