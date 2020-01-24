import { ACTION } from '../actions';

const login = (state = {
  mounted: false,
  session: window.localStorage.getItem('session'),
  sessionAttempted: false,
  loggedIn: false,
  logginMessage: '',
  gameJoined: false,
}, action) => {
  switch (action.type) {
    case ACTION.SET_SESSION_ATTEMPT:
      return { ...state, sessionAttempted: true };
    case ACTION.SET_SESSION:
      window.localStorage.setItem('session', action.uuid);
      return { ...state, session: action.uuid };
    case ACTION.SET_LOGGED_IN:
      return { ...state, loggedIn: action.status };
    case ACTION.SET_LOGIN_MESSAGE:
      return { ...state, logginMessage: action.message };
    case ACTION.SET_GAME_JOINED:
      return { ...state, gameJoined: action.status };
    default:
      return state;
  }
};
export default login;
