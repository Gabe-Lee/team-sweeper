/* eslint-disable no-restricted-syntax */
import { ACTION } from '../actions';

const updateArray = (array, updates) => {

  const newArray = array.slice();
  for (const update of updates) {
    console.log('coord:', update.y, update.x, 'set to:', update.space);
    newArray[update.y][update.x] = update.space;
  }
  return newArray;
};

const board = (state = [[]], action) => {
  switch (action.type) {
    case ACTION.SET_BOARD:
      return action.board;
    case ACTION.UPDATE_BOARD:
      return updateArray(state, action.spaces);
    default:
      return state;
  }
};
export default board;
