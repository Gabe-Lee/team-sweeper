export const ACTION = {
  SET_BOARD: 'SET_BOARD',
  UPDATE_BOARD: 'UPDATE_BOARD',
  SET_STATS: 'SET_STATS',
  UPDATE_STATS: 'UPDATE_STATS',
  SET_PLAYER: 'SET_PLAYER',
  SET_PLAYER_LIST: 'SET_PLAYER_LIST',
  CREATE_WEBSOCKET: 'CREATE_WEBSOCKET',
  SET_SESSION_ATTEMPT: 'SET_SESSION_ATTEMPT',
  SET_LOGGED_IN: 'SET_LOGGED_IN',
  SET_SESSION: 'SET_SESSION',
  SET_LOGIN_MESSAGE: 'SET_LOGIN_MESSAGE',
  SET_GAME_JOINED: 'SET_GAME_JOINED',
};

export const setBoard = (board) => ({
  type: ACTION.SET_BOARD, board,
});

export const updateBoard = (spaces) => ({
  type: ACTION.UPDATE_BOARD, spaces,
});

export const setStats = (stats) => ({
  type: ACTION.SET_STATS, stats,
});

export const updateStats = (stats) => ({
  type: ACTION.UPDATE_STATS, stats,
});

export const setPlayer = (player) => ({
  type: ACTION.SET_PLAYER, player,
});

export const setPlayerList = (playerList) => ({
  type: ACTION.SET_PLAYER_LIST, playerList,
});

export const createWebSocket = (webSocket) => ({
  type: ACTION.CREATE_WEBSOCKET, webSocket,
});

export const setSessionAttempted = () => ({
  type: ACTION.SET_SESSION_ATTEMPT,
});

export const setSession = (uuid) => ({
  type: ACTION.SET_SESSION, uuid,
});

export const setLoggedInStatus = (status) => ({
  type: ACTION.SET_LOGGED_IN, status,
});

export const setLoginMessage = (message) => ({
  type: ACTION.SET_LOGIN_MESSAGE, message,
});

export const setGameJoined = (status) => ({
  type: ACTION.SET_GAME_JOINED, status,
});
