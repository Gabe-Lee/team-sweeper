/* eslint-disable no-nested-ternary */
/* eslint-disable no-restricted-syntax */
import { ACTION } from '../actions';

const updateBoard = (board, updates) => {
  const newBoard = board.slice();
  for (const update of updates) {
    newBoard[update.y][update.x] = update.value;
  }
  return newBoard;
};

const updateFlags = (board, flag, isMine = false) => {
  const newBoard = board.slice();
  newBoard[flag.y][flag.x] = flag.isFlagged ? -2 : -1;
  return newBoard;
};

const board = (state = [[]], action) => {
  switch (action.type) {
    case ACTION.SET_BOARD:
      return action.board;
    case ACTION.UPDATE_BOARD:
      return updateBoard(state, action.spaces);
    case ACTION.UPDATE_FLAGS:
      return updateFlags(state, action.flag);
    case ACTION.SET_MY_FLAGS:
      return updateFlags(state, action.flag, true);
    default:
      return state;
  }
};
export default board;
