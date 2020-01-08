import React from 'react';
import T from 'prop-types';
import Space from './Space';

const Board = ({ board }) => (
  <div className="board">
    {board.map((space) => <Space mines={space.mines} flags={space.flags} />)}
  </div>
);
Board.propTypes = {
  board: T.arrayOf(T.arrayOf(T.shape(Space.propTypes))).isRequired,
};
export default Board;
