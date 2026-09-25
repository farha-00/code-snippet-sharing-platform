import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'snippets.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// Initialize database
export const db = new DatabaseSync(DB_PATH);

// Run initial schema
const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');
db.exec(schemaSql);

/**
 * Format snippet row from DB (parsing tags JSON)
 */
function formatSnippet(row) {
    if (!row) return null;
    let parsedTags = [];
    try {
        parsedTags = typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || []);
        if (!Array.isArray(parsedTags)) parsedTags = [];
    } catch {
        parsedTags = (row.tags || '').split(',').map(t => t.trim()).filter(Boolean);
    }
    return {
        ...row,
        tags: parsedTags
    };
}

/**
 * Format tags array into JSON string
 */
function serializeTags(tags) {
    if (Array.isArray(tags)) {
        return JSON.stringify(tags.map(t => String(t).trim().toLowerCase()).filter(Boolean));
    }
    if (typeof tags === 'string') {
        const list = tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
        return JSON.stringify(list);
    }
    return '[]';
}

/**
 * Fetch snippets with optional filters: search, language, tag, sort
 */
export function getSnippets({ search = '', language = '', tag = '', sort = 'newest' } = {}) {
    const conditions = [];
    const params = [];

    if (language && language.trim() !== '') {
        conditions.push('LOWER(language) = LOWER(?)');
        params.push(language.trim());
    }

    if (tag && tag.trim() !== '') {
        // Tag stored in JSON array, e.g. ["auth", "jwt"]
        conditions.push('(tags LIKE ? OR tags LIKE ?)');
        const cleanTag = tag.trim().toLowerCase();
        params.push(`%"${cleanTag}"%`, `%, ${cleanTag}%`);
    }

    if (search && search.trim() !== '') {
        const searchTerm = `%${search.trim().toLowerCase()}%`;
        conditions.push(`(
            LOWER(title) LIKE ? OR
            LOWER(description) LIKE ? OR
            LOWER(code) LIKE ? OR
            LOWER(author) LIKE ? OR
            LOWER(tags) LIKE ? OR
            LOWER(language) LIKE ?
        )`);
        params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    let whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    let orderBy = 'ORDER BY created_at DESC';
    if (sort === 'oldest') {
        orderBy = 'ORDER BY created_at ASC';
    } else if (sort === 'title_asc') {
        orderBy = 'ORDER BY LOWER(title) ASC';
    } else if (sort === 'title_desc') {
        orderBy = 'ORDER BY LOWER(title) DESC';
    } else if (sort === 'updated') {
        orderBy = 'ORDER BY updated_at DESC';
    }

    const query = `
        SELECT id, title, description, language, code, tags, author, created_at, updated_at
        FROM snippets
        ${whereClause}
        ${orderBy}
    `;

    const stmt = db.prepare(query);
    const rows = stmt.all(...params);
    return rows.map(formatSnippet);
}

/**
 * Get single snippet by ID
 */
export function getSnippetById(id) {
    const stmt = db.prepare('SELECT * FROM snippets WHERE id = ?');
    const row = stmt.get(Number(id));
    return formatSnippet(row);
}

/**
 * Insert a new snippet
 */
export function createSnippet({ title, description = '', language, code, tags = [], author }) {
    if (!title || !title.trim()) {
        throw new Error('Snippet title is required');
    }
    if (!language || !language.trim()) {
        throw new Error('Programming language is required');
    }
    if (!code || !code.trim()) {
        throw new Error('Snippet code is required');
    }
    if (!author || !author.trim()) {
        throw new Error('Author name is required');
    }

    const tagsJson = serializeTags(tags);
    const now = new Date().toISOString();

    const stmt = db.prepare(`
        INSERT INTO snippets (title, description, language, code, tags, author, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
        title.trim(),
        (description || '').trim(),
        language.trim(),
        code,
        tagsJson,
        author.trim(),
        now,
        now
    );

    return getSnippetById(result.lastInsertRowid);
}

/**
 * Update an existing snippet
 */
export function updateSnippet(id, { title, description = '', language, code, tags = [], author }) {
    const existing = getSnippetById(id);
    if (!existing) {
        return null;
    }

    if (!title || !title.trim()) {
        throw new Error('Snippet title is required');
    }
    if (!language || !language.trim()) {
        throw new Error('Programming language is required');
    }
    if (!code || !code.trim()) {
        throw new Error('Snippet code is required');
    }
    if (!author || !author.trim()) {
        throw new Error('Author name is required');
    }

    const tagsJson = serializeTags(tags);
    const now = new Date().toISOString();

    const stmt = db.prepare(`
        UPDATE snippets
        SET title = ?, description = ?, language = ?, code = ?, tags = ?, author = ?, updated_at = ?
        WHERE id = ?
    `);

    stmt.run(
        title.trim(),
        (description || '').trim(),
        language.trim(),
        code,
        tagsJson,
        author.trim(),
        now,
        Number(id)
    );

    return getSnippetById(id);
}

/**
 * Delete a snippet
 */
export function deleteSnippet(id) {
    const existing = getSnippetById(id);
    if (!existing) {
        return false;
    }

    const stmt = db.prepare('DELETE FROM snippets WHERE id = ?');
    stmt.run(Number(id));
    return true;
}

/**
 * Get distinct languages with counts
 */
export function getLanguages() {
    const stmt = db.prepare(`
        SELECT language, COUNT(*) as count
        FROM snippets
        GROUP BY LOWER(language)
        ORDER BY count DESC, language ASC
    `);
    return stmt.all();
}

/**
 * Get distinct tags with counts
 */
export function getAllTags() {
    const stmt = db.prepare('SELECT tags FROM snippets');
    const rows = stmt.all();
    const tagCountMap = {};

    for (const row of rows) {
        try {
            const list = JSON.parse(row.tags || '[]');
            if (Array.isArray(list)) {
                for (const t of list) {
                    const clean = t.trim().toLowerCase();
                    if (clean) {
                        tagCountMap[clean] = (tagCountMap[clean] || 0) + 1;
                    }
                }
            }
        } catch {
            // ignore malformed tags
        }
    }

    return Object.entries(tagCountMap)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/**
 * Get overall platform stats
 */
export function getStats() {
    const totalStmt = db.prepare('SELECT COUNT(*) as total_snippets FROM snippets');
    const totalSnippets = totalStmt.get().total_snippets;

    const authorsStmt = db.prepare('SELECT COUNT(DISTINCT LOWER(author)) as total_authors FROM snippets');
    const totalAuthors = authorsStmt.get().total_authors;

    const languages = getLanguages();
    const tags = getAllTags();

    return {
        totalSnippets,
        totalLanguages: languages.length,
        totalTags: tags.length,
        totalAuthors
    };
}
