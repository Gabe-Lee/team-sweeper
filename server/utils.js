module.exports.TIME = {
  SECOND: 1000,
  MINUTE: 60000,
  HOUR: 3600000,
  DAY: 86400000,
  WEEK: 604800000,
  MONTH: 2592000000,
  YEAR: 31536000000,
};

module.exports.assert = (assertion) => (value) => (
  assertion(value) ? Promise.resolve(value) : Promise.reject(value)
);

module.exports.sessionIsValid = (session) => (
  session !== undefined
  && session.uuid !== undefined
  && session.owner !== undefined
  && session.expires > Date.now()
  && session.loggedIn === true
);

module.exports.userIsValid = (user) => (
  user !== undefined
  && user.name !== undefined
  && user.hash !== undefined
);

module.exports.resultIsTrue = (value) => value === true;
