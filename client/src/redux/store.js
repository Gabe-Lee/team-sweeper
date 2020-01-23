import { createStore, combineReducers } from 'redux';
import board from './reducers/board';
import stats from './reducers/stats';
import { player, playerList } from './reducers/players';

export default createStore(combineReducers({
  board,
  stats,
  player,
  playerList,
}));
