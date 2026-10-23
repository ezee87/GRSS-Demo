import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const port = Number(process.env.PORT || 4173);
const redirects = new Set([
  '/abogados/alfonso-guati-rojo-sanchez/',
  '/abogados/jose-alfonso-guati-rojo-davila/',
  '/abogados/alfredo-manzur-nader/',
  '/abogados/michel-harfuch-gomez-de-orozco/'
]);
const types = { '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' };

createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
  if (redirects.has(pathname)) {
    response.writeHead(308, { Location: '/#equipo' });
    response.end();
    return;
  }
  const candidate = normalize(join(root, pathname));
  if (!candidate.startsWith(root)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }
  let file = candidate;
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file) && !extname(file) && existsSync(`${file}.html`)) file = `${file}.html`;
  let status = 200;
  if (!existsSync(file) || !statSync(file).isFile()) {
    file = join(root, '404.html');
    status = 404;
  }
  response.writeHead(status, { 'Content-Type': types[extname(file).toLowerCase()] || 'application/octet-stream' });
  createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1', () => console.log(`GRSS static demo: http://127.0.0.1:${port}`));
