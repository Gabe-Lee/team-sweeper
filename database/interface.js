const MongoDB = require('mongodb');
const { database } = require('../env');

const client = new MongoDB.MongoClient(database.URL, { useUnifiedTopology: true });

module.exports = {
  addUser(name, hash) {
    const newUser = {
      name,
      hash,
      sweeps: 0,
      score: 0,
      deaths: 0,
      time_alive: 0,
    };
    return client.connect()
      .then(() => client.db('TeamSweeper'))
      .then((db) => db.collection('Users'))
      .then((users) => users.insertOne(newUser))
      .then((result) => {
        if (result.insertedCount > 0) {
          return newUser;
        }
        return {};
      });
  },
  getUser(name) {
    return client.connect()
      .then(() => client.db('TeamSweeper'))
      .then((db) => db.collection('Users'))
      .then((users) => users.findOne({ name }));
  },
  newSession(session) {
    const { uuid, owner, expires, loggedIn } = session;
    return client.connect()
      .then(() => client.db('TeamSweeper'))
      .then((db) => db.collection('Sessions'))
      .then((sessions) => sessions.insertOne({ uuid, owner, expires, loggedIn }));
  },
  checkSession(uuid) {
    return client.connect()
      .then(() => client.db('TeamSweeper'))
      .then((db) => db.collection('Sessions'))
      .then((sessions) => sessions.findOne({ uuid }))
      .then((session) => {
        if (session.expires < Date.now()) {
          sessions.deleteOne({ uuid });
          return null;
        }
        return session;
      });
  },
};
