const http = require('http');
const server = require('./lib/server');

http.createServer((req, res) => {
  server(req, res);
}).listen(3000);
