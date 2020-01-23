import { ACTION } from '../actions';

const board = (state = [[]], action) => {
  switch (action.type) {
    case ACTION.SET_BOARD:
      return action.board;
    case ACTION.UPDATE_BOARD:
      for (const change of action.data.spaces) {
        state[change.y][change.x] = change.space;
      }
      return state;
    default:
      return state;
  }
};
export default board;
