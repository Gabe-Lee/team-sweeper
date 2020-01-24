/* eslint-disable no-underscore-dangle */
import { createStore, combineReducers } from 'redux';
import board from './reducers/board';
import stats from './reducers/stats';
import { player, playerList } from './reducers/players';
import login from './reducers/login';
import webSocket from './reducers/webSocket';

export default createStore(combineReducers({
  board,
  stats,
  player,
  playerList,
  login,
  webSocket,
}), window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__());
