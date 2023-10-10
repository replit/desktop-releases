const http = require('http');
const server = require('./lib/server');

http.createServer((req, res) => {
  console.log('Starting server on port 3000');
  server(req, res);
}).listen(3000);
