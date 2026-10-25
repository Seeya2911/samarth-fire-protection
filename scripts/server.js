const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const rootDir = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8'
};

const server = http.createServer((req, res) => {
  // Parse URL to ignore query strings/hashes
  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  let pathname = parsedUrl.pathname;
  
  if (pathname === '/') {
    pathname = '/index.html';
  }
  
  // Safe path resolution to prevent directory traversal
  const safePath = path.normalize(path.join(rootDir, pathname));
  if (!safePath.startsWith(rootDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden: Path traversal detected');
    return;
  }
  
  let filePath = safePath;
  let ext = path.extname(filePath);
  if (!ext) {
    filePath += '.html';
    ext = '.html';
  }

  // Set standard security headers on all responses
  const baseHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { ...baseHeaders, 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>404 Page Not Found</h1><p>Samarth Fire static server could not find the requested route.</p>', 'utf-8');
      } else {
        res.writeHead(500, baseHeaders);
        res.end(`Internal Server Error: ${error.code}`);
      }
    } else {
      res.writeHead(200, {
        ...baseHeaders,
        'Content-Type': MIME_TYPES[ext] || 'application/octet-stream'
      });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server successfully started on port ${PORT}!`);
  console.log(`Serving on http://0.0.0.0:${PORT}/`);
});
