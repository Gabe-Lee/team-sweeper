const server = require('./server');
const { local } = require('../env');

const PORT = process.env.PORT || local.env.PORT;

server.listen(PORT, () => {
  console.log(`Server is listening at ${local.env.URL}`);
});
