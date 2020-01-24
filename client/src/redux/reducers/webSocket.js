import { ACTION } from '../actions';

const webSocket = (state = {}, action) => {
  switch (action.type) {
    case ACTION.CREATE_WEBSOCKET:
      console.log(action.webSocket);
      return action.webSocket;
    default:
      return state;
  }
};
export default webSocket;
