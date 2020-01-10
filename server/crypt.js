const bcrypt = require('bcrypt');
const saltRounds = 10;

module.exports.createHash = (password) => bcrypt.hash(password, saltRounds);

module.exports.compareHash = (password, hash) => bcrypt.compare(password, hash);
