-- Code Snippet Sharing Platform Schema
CREATE TABLE IF NOT EXISTS snippets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    language TEXT NOT NULL,
    code TEXT NOT NULL,
    tags TEXT NOT NULL DEFAULT '[]', -- JSON array of string tags
    author TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_snippets_language ON snippets(language);
CREATE INDEX IF NOT EXISTS idx_snippets_author ON snippets(author);
CREATE INDEX IF NOT EXISTS idx_snippets_created ON snippets(created_at DESC);
