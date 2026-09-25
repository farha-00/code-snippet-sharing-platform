# Code Snippet Sharing Platform (SnippetForge)

A clean, modern, and high-performance Code Snippet Sharing Platform organized into modular **Frontend**, **Backend**, and **Database** components.

---

## 🌟 Key Features

- **Full CRUD Capabilities**:
  - **Create**: Add new snippets with Title, Description, Programming Language, Code, Tags, and Author.
  - **View**: Inspect snippets in a detail view with real-time syntax highlighting, line numbers, and metadata.
  - **Edit**: Modify existing snippets with live-populated forms and instant updates.
  - **Delete**: Safely delete snippets with confirmation dialogs.
- **Search & Filter Engine**:
  - **Global Full-Text Search**: Live, debounced search across title, description, code, tags, and author.
  - **Language Filtering**: Filter by language (JavaScript, TypeScript, Python, SQL, Rust, Go, CSS, etc.).
  - **Tag Filter Cloud**: Filter snippets by interactive tag badges with frequency counts.
  - **Multi-Sort**: Sort by Newest, Oldest, Title (A-Z / Z-A), and Recently Updated.
- **Developer UX Enhancements**:
  - **Syntax Highlighting & Line Numbers**: Built-in syntax highlighting for keywords, strings, comments, numbers, and functions.
  - **One-Click Copy**: Instant clipboard copying with visual toast feedback.
  - **Download Snippet**: Download any snippet as a native source file (`.js`, `.py`, `.sql`, `.rs`, `.go`, etc.).
  - **Tab Indentation**: Indent code in the editor with `Tab` without losing focus.
  - **Theme Switcher**: Dark mode (default) and Light mode with persistent user preference.
  - **Pre-seeded Library**: Rich sample snippets pre-loaded on initial launch.

---

## 🏗️ Project Architecture

The project is structured with a clear separation of concerns across three core components:

```
code snippet sharing platform/
├── backend/
│   ├── server.js          # HTTP server, routing, static asset serving, port fallback
│   └── routes.js          # REST API router, JSON body parser, and controllers
├── database/
│   ├── db.js              # Native SQLite connection & CRUD operations (node:sqlite)
│   ├── schema.sql         # SQL schema definitions and indexes
│   ├── seed.js            # Initial high-quality seed data script
│   └── snippets.db        # SQLite database file (auto-generated)
├── frontend/
│   ├── index.html         # Modern SPA layout and modal dialogs
│   ├── css/
│   │   └── style.css      # Developer-focused theme, tokens, responsive grid
│   └── js/
│       ├── app.js         # Core application coordinator & state management
│       ├── api.js         # Backend REST API client
│       ├── highlight.js   # Syntax highlighter & line numbering engine
│       └── ui.js          # DOM rendering, cards, tags, and toast notifications
├── node.cmd               # Node runtime wrapper
├── start.bat              # One-click startup batch script
├── package.json           # Project metadata & npm scripts
└── README.md              # Documentation & API reference
```

---

## 📡 REST API Reference

| Method | Endpoint | Description | Query Parameters / Body |
|---|---|---|---|
| `GET` | `/api/snippets` | List snippets with optional filters | `?search=...&language=...&tag=...&sort=newest` |
| `GET` | `/api/snippets/:id` | Fetch single snippet by ID | - |
| `POST` | `/api/snippets` | Create a new snippet | `{ title, description, language, code, tags, author }` |
| `PUT` | `/api/snippets/:id` | Update an existing snippet | `{ title, description, language, code, tags, author }` |
| `DELETE` | `/api/snippets/:id` | Delete a snippet | - |
| `GET` | `/api/languages` | Get all distinct languages & counts | - |
| `GET` | `/api/tags` | Get all distinct tags & counts | - |
| `GET` | `/api/stats` | Platform statistics (total counts) | - |
| `POST` | `/api/seed` | Reset database to default samples | - |

---

## 🗄️ Database Schema

The SQLite schema (`database/schema.sql`):

```sql
CREATE TABLE IF NOT EXISTS snippets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    language TEXT NOT NULL,
    code TEXT NOT NULL,
    tags TEXT NOT NULL DEFAULT '[]', -- JSON array of tags
    author TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_snippets_language ON snippets(language);
CREATE INDEX IF NOT EXISTS idx_snippets_author ON snippets(author);
CREATE INDEX IF NOT EXISTS idx_snippets_created ON snippets(created_at DESC);
```

---

## 🚀 Running the Platform

### Option 1: Quick Launch (Windows)
Double-click `start.bat` in the project root folder.

### Option 2: Command Line
```powershell
agy-node backend/server.js
```
or (if Node.js is installed on your PATH):
```powershell
node backend/server.js
```

### Accessing the Web Application:
Open your browser and navigate to:
**http://localhost:3000**
