module.exports.server = {
  env: {
    PORT: 5555,
    HOST: 'localhost',
    URL: process.env.PORT ? 'https://team-sweeper.herokuapp.com' : 'http://localhost:5555',
    SOCKET: process.env.PORT ? 'wss://team-sweeper.herokuapp.com' : 'ws://localhost:5555',
  },
};

module.exports.database = {
  URL: 'mongodb+srv://Gabe:ElDvwRMgltwVMUkN@teamsweeper0-uxlss.mongodb.net/test?retryWrites=true&w=majority',
  USER: 'Gabe',
  DB: 'TeamSweeper',
  USERS: 'Users',
  PASS: 'ElDvwRMgltwVMUkN',
};
