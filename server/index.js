const server = require('./server');
require('dotenv').config();

const PORT = process.env.PORT || process.env.LOCAL_PORT;

server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
