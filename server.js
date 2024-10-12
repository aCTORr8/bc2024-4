const http = require('http');
const { Command } = require('commander');
const fs = require('fs').promises;
const path = require('path');
const superagent = require('superagent');

const program = new Command();

program
  .requiredOption('-h, --host <host>', 'Server address')
  .requiredOption('-p, --port <port>', 'Server port')
  .requiredOption('-c, --cache <path>', 'Path to the cache directory');

program.parse(process.argv);
const options = program.opts();
const cacheDir = options.cache;

const server = http.createServer(async (req, res) => {
  const urlPath = req.url.slice(1); // Отримання коду з URL (наприклад, /200 -> 200)
  const filePath = path.join(cacheDir, `${urlPath}.jpg`);

  if (req.method === 'GET') {
    try {
      const data = await fs.readFile(filePath);
      res.writeHead(200, { 'Content-Type': 'image/jpeg' });
      res.end(data);
      console.log(`Served cached image for HTTP code: ${urlPath}`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Якщо картинка не знайдена, робимо запит на http.cat
        try {
          const response = await superagent.get(`https://http.cat/${urlPath}`);
          const imageData = response.body;

          // Зберігаємо отриману картинку у кеш
          await fs.writeFile(filePath, imageData);
          res.writeHead(200, { 'Content-Type': 'image/jpeg' });
          res.end(imageData);
          console.log(`Fetched and cached image for HTTP code ${urlPath} from http.cat`);
        } catch (fetchError) {
          // Якщо виникла помилка при запиті до http.cat
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Image not found on http.cat');
          console.log(`Failed to fetch image for HTTP code ${urlPath} from http.cat`);
        }
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server error');
        console.error('Error reading cache:', error);
      }
    }
  } else if (req.method === 'PUT') {
    let body = [];
    req.on('data', chunk => {
      body.push(chunk);
    }).on('end', async () => {
      const data = Buffer.concat(body);
      try {
        await fs.writeFile(filePath, data);
        res.writeHead(201, { 'Content-Type': 'text/plain' });
        res.end('Image saved in cache');
        console.log(`Saved image for HTTP code ${urlPath} to cache`);
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error saving image');
        console.error('Error saving to cache:', error);
      }
    });
  } else if (req.method === 'DELETE') {
    try {
      await fs.unlink(filePath);
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Image deleted from cache');
      console.log(`Deleted cached image for HTTP code ${urlPath}`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Image not found in cache');
        console.log(`No cached image found for HTTP code ${urlPath} to delete`);
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error deleting image');
        console.error('Error deleting from cache:', error);
      }
    }
  } else {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method not allowed');
    console.log(`Received unsupported HTTP method: ${req.method}`);
  }
});

server.listen(options.port, options.host, () => {
  console.log(`Server running at http://${options.host}:${options.port}/`);
  console.log(`Cache directory is set to: ${cacheDir}`);
});
