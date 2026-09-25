import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleApiRoute } from './routes.js';
import { seedDatabase } from '../database/seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIR = path.resolve(__dirname, '../frontend');

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8'
};

// Check and auto-seed database if empty
seedDatabase(false);

/**
 * Serve static frontend assets
 */
function serveStaticFile(req, res, pathname) {
    let filePath = pathname === '/' ? path.join(FRONTEND_DIR, 'index.html') : path.join(FRONTEND_DIR, pathname);

    // Normalize and prevent directory traversal
    filePath = path.normalize(filePath);
    if (!filePath.startsWith(FRONTEND_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Access Denied');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            // Fallback for single page or not found
            const fallbackPath = path.join(FRONTEND_DIR, 'index.html');
            fs.readFile(fallbackPath, (fallbackErr, data) => {
                if (fallbackErr) {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('404 Not Found');
                } else {
                    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end(data);
                }
            });
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        fs.readFile(filePath, (readErr, data) => {
            if (readErr) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Server Error');
                return;
            }
            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache'
            });
            res.end(data);
        });
    });
}

/**
 * Main Request Listener
 */
const server = http.createServer(async (req, res) => {
    try {
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers.host || 'localhost';
        const parsedUrl = new URL(req.url, `${protocol}://${host}`);

        // Try API routes first
        const handled = await handleApiRoute(req, res, parsedUrl);
        if (handled) return;

        // Otherwise serve frontend static files
        serveStaticFile(req, res, parsedUrl.pathname);
    } catch (err) {
        console.error('Unhandled request error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal Server Error' }));
    }
});

let DEFAULT_PORT = parseInt(process.env.PORT || '3000', 10);

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

function startServer(port) {
    server.listen(port, () => {
        console.log(`====================================================`);
        console.log(` SnippetForge Platform Server Running!`);
        console.log(` Local URL: http://localhost:${port}`);
        console.log(` API Endpoint: http://localhost:${port}/api/snippets`);
        console.log(`====================================================`);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.warn(`Port ${port} in use, trying port ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('Server error:', err);
        }
    });
}

startServer(DEFAULT_PORT);

