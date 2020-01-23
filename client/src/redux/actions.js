export const ACTION = {
  SET_BOARD: 'SET_BOARD',
  UPDATE_BOARD: 'UPDATE_BOARD',
  SET_STATS: 'SET_STATS',
  UPDATE_STATS: 'UPDATE_STATS',
  SET_PLAYER: 'SET_PLAYER',
  SET_PLAYER_LIST: 'SET_PLAYER_LIST',
  CREATE_WEBSOCKET: 'CREATE_WEBSOCKET',
};

export const setBoard = (board) => ({
  type: ACTION.SET_BOARD, board,
});

export const setStats = (stats) => ({
  type: ACTION.SET_STATS, stats,
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
