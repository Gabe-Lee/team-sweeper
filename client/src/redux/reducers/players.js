import { ACTION } from '../actions';

export const player = (state = '', action) => {
  switch (action.type) {
    case ACTION.SET_PLAYER:
      return action.player;
    default:
      return state;
  }
};

export const playerList = (state = [], action) => {
  switch (action.type) {
    case ACTION.SET_PLAYER_LIST:
      return action.playerList;
    default:
      return state;
  }
};
