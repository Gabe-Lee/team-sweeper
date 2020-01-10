const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  hash: String,
  sweeps: Number,
  score: Number,
  deaths: Number,
  time_alive: Number,
});

module.exports.User = mongoose.model('User', userSchema);;
