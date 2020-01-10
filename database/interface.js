const mongoose = require('mongoose');
const { User } = require('./models.js');
const { database } = require('../env');

mongoose.connect(database.URL, { useNewUrlParser: true });

module.exports = {
  addUser(name, hash) {
    console.log(name)
    return new Promise((pass, fail) => {
      User.create({
        name,
        hash,
        sweeps: 0,
        score: 0,
        deaths: 0,
        time_alive: 0,
      }, (err, result) => {
        if (err) { fail(err); }
        else { pass(result); }
      });
    }
    )},
  getUser(name) {
    console.log(name)
    return new Promise((pass, fail) => {
      User.findOne({ name }, (err, docs) => {
        console.log(err, docs)
        if (err) { fail(err); }
        else { pass(docs); }
      });
    }
  )},
};
