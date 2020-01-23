import { FLAGS } from '../../../../server/game';
import { ACTION } from '../actions';

const gameState = (state = {
  minesLeft: 0,
  clearLeft: 0,
  timer: 0,
  status: FLAGS.NONE,
  deaths: 0,
  flagCount: 0,
}, action) => {
  switch (action.type) {
    case ACTION.SET_STATS:
      return action.stats;
    case ACTION.UPDATE_STATS:
      return { ...state, ...action.stats };
    default:
      return state;
  }
};
export default gameState;
