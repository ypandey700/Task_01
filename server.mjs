import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';
const root = resolve('dist');
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};
http.createServer(async (request, response) => {
  try {
    const path = resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
    if (path !== root && !path.startsWith(root + sep)) { response.writeHead(403).end('Forbidden'); return; }
    const file = path === root ? resolve(root,'index.html') : path;
    const body = await readFile(file);
    response.writeHead(200, {'Content-Type':types[extname(file)] || 'application/octet-stream','Cache-Control':'no-store'});
    response.end(body);
  } catch { if (!response.headersSent) response.writeHead(404); response.end('Not found'); }
}).listen(4173, '127.0.0.1', () => console.log('Firststep: http://127.0.0.1:4173'));
