import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = new URL('./dist/', import.meta.url);
const types = { html: 'text/html; charset=utf-8', css: 'text/css', mjs: 'text/javascript', svg: 'image/svg+xml' };
http.createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = new URL(path === '/' ? 'index.html' : path.slice(1), root);
    if (!fileURLToPath(file).startsWith(fileURLToPath(root))) throw new Error('Invalid path');
    const content = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[file.pathname.split('.').pop()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(content);
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(4173, '127.0.0.1', () => console.log('Local: http://127.0.0.1:4173'));
