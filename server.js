const http = require('http');
const { Command } = require('commander');
const fs = require('fs').promises;
const path = require('path');

const program = new Command();

program
  .requiredOption('-h, --host <host>', 'Server address')
  .requiredOption('-p, --port <port>', 'Server port')
  .requiredOption('-c, --cache <path>', 'Path to the cache directory');

program.parse(process.argv);
const options = program.opts();

const cacheDir = options.cache;

// Створення HTTP сервера
const server = http.createServer(async (req, res) => {
  const urlPath = req.url.slice(1); // Отримання коду з URL (наприклад, /200 -> 200)
  const filePath = path.join(cacheDir, `${urlPath}.png`);

  try {
    // Спроба прочитати файл з кешу
    const data = await fs.readFile(filePath);
    res.writeHead(200, { 'Content-Type': 'image/png' });
    res.end(data);
    console.log(`Served cached image for HTTP code: ${urlPath}`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Файл не знайдений у кеші
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Image not found in cache');
      console.log(`Image for HTTP code ${urlPath} not found in cache`);
    } else {
      // Інші помилки
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Server error');
      console.error('Error reading cache:', error);
    }
  }
});

server.listen(options.port, options.host, () => {
  console.log(`Server running at http://${options.host}:${options.port}/`);
  console.log(`Cache directory is set to: ${cacheDir}`);
});
