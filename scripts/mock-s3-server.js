const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3101;
const MOCK_S3_DIR = path.join(process.cwd(), 'prisma', 'mock-s3');

function ensureMockDir() {
  if (!fs.existsSync(MOCK_S3_DIR)) {
    fs.mkdirSync(MOCK_S3_DIR, { recursive: true });
  }
}

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Expose-Headers', 'ETag, Content-Type, Content-Length');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    const parsedUrl = url.parse(req.url, true);
    const key = parsedUrl.query.key;

    if (!key) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Key is required' }));
      return;
    }

    ensureMockDir();

    // Safety check against path traversal: block dot-dot and normalize key
    const normalizedKey = key.replace(/\\/g, '/').replace(/\.\./g, '');
    const filePath = path.join(MOCK_S3_DIR, normalizedKey.replace(/\//g, '_'));

    // Verify resolving path remains inside MOCK_S3_DIR
    const resolvedPath = path.resolve(filePath);
    const resolvedMockDir = path.resolve(MOCK_S3_DIR);
    if (!resolvedPath.startsWith(resolvedMockDir)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid key / path traversal detected' }));
      return;
    }

    if (req.method === 'GET') {
      if (!fs.existsSync(resolvedPath)) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'File not found in mock storage' }));
        return;
      }

      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${path.basename(key)}"`,
      });
      const readStream = fs.createReadStream(resolvedPath);

      readStream.on('error', (err) => {
        console.error('[Mock S3 Server GET Stream Error]', err);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to stream the requested file' }));
        }
      });

      readStream.pipe(res);
    } else if (req.method === 'PUT') {
      const writeStream = fs.createWriteStream(resolvedPath);

      writeStream.on('error', (err) => {
        console.error('[Mock S3 Server Write Stream Error]', err);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to write object to mock disk' }));
        }
        writeStream.destroy();
      });

      req.pipe(writeStream);

      writeStream.on('finish', () => {
        if (!res.headersSent) {
          res.setHeader('ETag', '"mock-etag"');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        }
      });

      req.on('error', (err) => {
        console.error('[Mock S3 Server PUT Request Error]', err);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
        writeStream.destroy();
      });
    } else if (req.method === 'DELETE') {
      if (fs.existsSync(resolvedPath)) {
        fs.unlinkSync(resolvedPath);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } else {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed' }));
    }
  } catch (error) {
    console.error('[Mock S3 Server Error]', error);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  }
});

server.listen(PORT, () => {
  console.log(`[Mock S3 Server] Listening on http://localhost:${PORT}`);
});
