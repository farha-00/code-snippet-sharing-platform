import {
    getSnippets,
    getSnippetById,
    createSnippet,
    updateSnippet,
    deleteSnippet,
    getLanguages,
    getAllTags,
    getStats
} from '../database/db.js';
import { seedDatabase } from '../database/seed.js';

/**
 * Parse JSON body from IncomingMessage
 */
async function parseJsonBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk;
            // Prevent payload overflow (max 2MB for code snippets)
            if (body.length > 2 * 1024 * 1024) {
                reject(new Error('Payload too large'));
            }
        });
        req.on('end', () => {
            if (!body.trim()) {
                resolve({});
                return;
            }
            try {
                resolve(JSON.parse(body));
            } catch (err) {
                reject(new Error('Invalid JSON'));
            }
        });
        req.on('error', reject);
    });
}

/**
 * Send JSON response helper
 */
function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end(JSON.stringify(data));
}

/**
 * Handle API routes
 */
export async function handleApiRoute(req, res, parsedUrl) {
    const { pathname, searchParams } = parsedUrl;
    const method = req.method.toUpperCase();

    // CORS Preflight
    if (method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400'
        });
        res.end();
        return true;
    }

    try {
        // GET /api/stats
        if (method === 'GET' && pathname === '/api/stats') {
            const stats = getStats();
            sendJson(res, 200, { success: true, data: stats });
            return true;
        }

        // GET /api/languages
        if (method === 'GET' && pathname === '/api/languages') {
            const languages = getLanguages();
            sendJson(res, 200, { success: true, data: languages });
            return true;
        }

        // GET /api/tags
        if (method === 'GET' && pathname === '/api/tags') {
            const tags = getAllTags();
            sendJson(res, 200, { success: true, data: tags });
            return true;
        }

        // POST /api/seed (reseed database)
        if (method === 'POST' && pathname === '/api/seed') {
            const result = seedDatabase(true);
            sendJson(res, 200, { success: true, message: 'Database reseeded successfully', ...result });
            return true;
        }

        // Match /api/snippets/:id
        const snippetIdMatch = pathname.match(/^\/api\/snippets\/(\d+)$/);

        if (snippetIdMatch) {
            const snippetId = Number(snippetIdMatch[1]);

            // GET /api/snippets/:id
            if (method === 'GET') {
                const snippet = getSnippetById(snippetId);
                if (!snippet) {
                    sendJson(res, 404, { success: false, error: 'Snippet not found' });
                    return true;
                }
                sendJson(res, 200, { success: true, data: snippet });
                return true;
            }

            // PUT /api/snippets/:id
            if (method === 'PUT') {
                const payload = await parseJsonBody(req);
                const { title, description, language, code, tags, author } = payload;

                if (!title || !title.trim()) {
                    sendJson(res, 400, { success: false, error: 'Title is required' });
                    return true;
                }
                if (!language || !language.trim()) {
                    sendJson(res, 400, { success: false, error: 'Programming language is required' });
                    return true;
                }
                if (!code || !code.trim()) {
                    sendJson(res, 400, { success: false, error: 'Code is required' });
                    return true;
                }
                if (!author || !author.trim()) {
                    sendJson(res, 400, { success: false, error: 'Author is required' });
                    return true;
                }

                const updated = updateSnippet(snippetId, {
                    title,
                    description,
                    language,
                    code,
                    tags,
                    author
                });

                if (!updated) {
                    sendJson(res, 404, { success: false, error: 'Snippet not found' });
                    return true;
                }

                sendJson(res, 200, { success: true, data: updated, message: 'Snippet updated successfully' });
                return true;
            }

            // DELETE /api/snippets/:id
            if (method === 'DELETE') {
                const deleted = deleteSnippet(snippetId);
                if (!deleted) {
                    sendJson(res, 404, { success: false, error: 'Snippet not found' });
                    return true;
                }
                sendJson(res, 200, { success: true, message: 'Snippet deleted successfully' });
                return true;
            }

            // Unhandled method on /api/snippets/:id
            sendJson(res, 405, { success: false, error: 'Method Not Allowed' });
            return true;
        }

        // /api/snippets
        if (pathname === '/api/snippets') {
            // GET /api/snippets (with search, language, tag, sort)
            if (method === 'GET') {
                const search = searchParams.get('search') || '';
                const language = searchParams.get('language') || '';
                const tag = searchParams.get('tag') || '';
                const sort = searchParams.get('sort') || 'newest';

                const snippets = getSnippets({ search, language, tag, sort });
                sendJson(res, 200, {
                    success: true,
                    count: snippets.length,
                    data: snippets
                });
                return true;
            }

            // POST /api/snippets (create new)
            if (method === 'POST') {
                const payload = await parseJsonBody(req);
                const { title, description, language, code, tags, author } = payload;

                if (!title || !title.trim()) {
                    sendJson(res, 400, { success: false, error: 'Title is required' });
                    return true;
                }
                if (!language || !language.trim()) {
                    sendJson(res, 400, { success: false, error: 'Programming language is required' });
                    return true;
                }
                if (!code || !code.trim()) {
                    sendJson(res, 400, { success: false, error: 'Code content is required' });
                    return true;
                }
                if (!author || !author.trim()) {
                    sendJson(res, 400, { success: false, error: 'Author is required' });
                    return true;
                }

                const newSnippet = createSnippet({
                    title,
                    description,
                    language,
                    code,
                    tags,
                    author
                });

                sendJson(res, 201, {
                    success: true,
                    data: newSnippet,
                    message: 'Snippet created successfully'
                });
                return true;
            }

            sendJson(res, 405, { success: false, error: 'Method Not Allowed' });
            return true;
        }

        // Unknown API route
        if (pathname.startsWith('/api/')) {
            sendJson(res, 404, { success: false, error: 'Endpoint not found' });
            return true;
        }

        return false; // Not an API route, pass to static server
    } catch (err) {
        console.error('API Error:', err);
        sendJson(res, 500, { success: false, error: err.message || 'Internal Server Error' });
        return true;
    }
}
