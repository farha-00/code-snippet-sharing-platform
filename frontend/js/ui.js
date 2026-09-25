import { renderCodeBlockWithNumbers, highlightCode } from './highlight.js';

// Language theme colors and file extensions
export const LANGUAGE_CONFIG = {
    javascript: { name: 'JavaScript', color: '#f7df1e', bg: 'rgba(247, 223, 30, 0.12)', ext: 'js' },
    typescript: { name: 'TypeScript', color: '#3178c6', bg: 'rgba(49, 120, 198, 0.12)', ext: 'ts' },
    python: { name: 'Python', color: '#387eb8', bg: 'rgba(56, 126, 184, 0.12)', ext: 'py' },
    sql: { name: 'SQL', color: '#e38c00', bg: 'rgba(227, 140, 0, 0.12)', ext: 'sql' },
    rust: { name: 'Rust', color: '#f74c00', bg: 'rgba(247, 76, 0, 0.12)', ext: 'rs' },
    go: { name: 'Go', color: '#00add8', bg: 'rgba(0, 173, 216, 0.12)', ext: 'go' },
    css: { name: 'CSS', color: '#264de4', bg: 'rgba(38, 77, 228, 0.12)', ext: 'css' },
    html: { name: 'HTML', color: '#e34f26', bg: 'rgba(227, 79, 38, 0.12)', ext: 'html' },
    cpp: { name: 'C++', color: '#00599c', bg: 'rgba(0, 89, 156, 0.12)', ext: 'cpp' },
    c: { name: 'C', color: '#555555', bg: 'rgba(85, 85, 85, 0.12)', ext: 'c' },
    java: { name: 'Java', color: '#b07219', bg: 'rgba(176, 114, 25, 0.12)', ext: 'java' },
    json: { name: 'JSON', color: '#40d287', bg: 'rgba(64, 210, 135, 0.12)', ext: 'json' },
    bash: { name: 'Bash / Shell', color: '#89e051', bg: 'rgba(137, 224, 81, 0.12)', ext: 'sh' },
    php: { name: 'PHP', color: '#777bb4', bg: 'rgba(119, 123, 180, 0.12)', ext: 'php' },
    ruby: { name: 'Ruby', color: '#701516', bg: 'rgba(112, 21, 22, 0.12)', ext: 'rb' }
};

export function getLanguageInfo(language = '') {
    const key = (language || '').toLowerCase().trim();
    if (LANGUAGE_CONFIG[key]) {
        return LANGUAGE_CONFIG[key];
    }
    // Return friendly fallback
    return {
        name: language || 'Plain Code',
        color: '#818cf8',
        bg: 'rgba(129, 140, 248, 0.12)',
        ext: 'txt'
    };
}

/**
 * Format relative time
 */
export function formatTimeAgo(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return 'just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Render snippet card HTML
 */
export function renderSnippetCard(snippet) {
    const langInfo = getLanguageInfo(snippet.language);
    const timeAgo = formatTimeAgo(snippet.created_at);
    const tags = Array.isArray(snippet.tags) ? snippet.tags : [];

    // Truncate code for preview (max 6 lines)
    const codeLines = snippet.code.split('\n');
    const previewLines = codeLines.slice(0, 6).join('\n');
    const isTruncated = codeLines.length > 6;

    const highlightedPreview = renderCodeBlockWithNumbers(previewLines, snippet.language);

    return `
        <div class="snippet-card" data-id="${snippet.id}">
            <div class="snippet-header">
                <div class="snippet-lang-author">
                    <span class="lang-pill" style="--pill-color: ${langInfo.color}; --pill-bg: ${langInfo.bg};">
                        <span class="lang-dot" style="background-color: ${langInfo.color};"></span>
                        ${escapeHtml(langInfo.name)}
                    </span>
                    <span class="author-meta">
                        <svg class="icon-inline" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <span class="author-name" title="${escapeHtml(snippet.author)}">${escapeHtml(snippet.author)}</span>
                        <span class="meta-dot">•</span>
                        <span class="meta-time" title="${escapeHtml(snippet.created_at)}">${timeAgo}</span>
                    </span>
                </div>
                <div class="card-quick-actions">
                    <button class="btn-icon copy-snippet-btn" title="Copy code" data-id="${snippet.id}">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    </button>
                </div>
            </div>

            <h3 class="snippet-title view-trigger" data-id="${snippet.id}">
                ${escapeHtml(snippet.title)}
            </h3>

            ${snippet.description ? `
                <p class="snippet-description">${escapeHtml(snippet.description)}</p>
            ` : ''}

            <div class="snippet-code-preview view-trigger" data-id="${snippet.id}" title="Click to view full snippet">
                ${highlightedPreview}
                ${isTruncated ? `
                    <div class="preview-more-overlay">
                        <span>+ ${codeLines.length - 6} more lines • Click to view full code</span>
                    </div>
                ` : ''}
            </div>

            ${tags.length > 0 ? `
                <div class="snippet-tags">
                    ${tags.map(t => `<button class="tag-badge filter-tag-btn" data-tag="${escapeHtml(t)}">#${escapeHtml(t)}</button>`).join('')}
                </div>
            ` : ''}

            <div class="snippet-footer">
                <div class="footer-left">
                    <span class="line-count-badge">${codeLines.length} lines</span>
                </div>
                <div class="footer-actions">
                    <button class="btn-ghost btn-sm view-snippet-btn" data-id="${snippet.id}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        View
                    </button>
                    <button class="btn-ghost btn-sm edit-snippet-btn" data-id="${snippet.id}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        Edit
                    </button>
                    <button class="btn-ghost btn-sm btn-danger delete-snippet-btn" data-id="${snippet.id}" title="Delete snippet">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Show notification toast
 */
export function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
        iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'error') {
        iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    } else {
        iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `
        <span class="toast-icon">${iconSvg}</span>
        <span class="toast-msg">${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.classList.add('visible');
    });

    // Auto remove after 3.2s
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    }, 3200);
}

/**
 * Helper to escape HTML strings safely
 */
export function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
