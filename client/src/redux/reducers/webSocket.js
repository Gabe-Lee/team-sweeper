import { ACTION } from '../actions';

const webSocket = (state = null, action) => {
  switch (action.type) {
    case ACTION.CREATE_WEBSOCKET:
      return action.webSocket;
    default:
      return state;
  }
};
export default webSocket;
