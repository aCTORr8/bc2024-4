const http = require('http');
const { Command } = require('commander');
const program = new Command();

program
  .requiredOption('-h, --host <host>', 'Server address')
  .requiredOption('-p, --port <port>', 'Server port')
  .requiredOption('-c, --cache <cache>', 'Path to cache directory');

program.parse(process.argv);

const { host, port, cache } = program.opts();

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Server is running');
});

server.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}/`);
  console.log(`Cache directory is set to: ${cache}`);
});
