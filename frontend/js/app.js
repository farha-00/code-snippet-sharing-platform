import { api } from './api.js';
import {
    renderSnippetCard,
    showToast,
    escapeHtml,
    getLanguageInfo,
    formatTimeAgo
} from './ui.js';
import { renderCodeBlockWithNumbers } from './highlight.js';

// Application State
const state = {
    snippets: [],
    filters: {
        search: '',
        language: '',
        tag: '',
        sort: 'newest'
    },
    currentEditingId: null,
    currentViewingSnippet: null,
    deleteTargetId: null,
    theme: localStorage.getItem('sh_theme') || 'dark'
};

// DOM Elements
const elements = {
    // Stats
    statSnippets: document.getElementById('stat-snippets'),
    statLanguages: document.getElementById('stat-languages'),
    statTags: document.getElementById('stat-tags'),
    statAuthors: document.getElementById('stat-authors'),

    // Search & Filter
    searchInput: document.getElementById('search-input'),
    clearSearchBtn: document.getElementById('clear-search-btn'),
    languageSelect: document.getElementById('language-select'),
    sortSelect: document.getElementById('sort-select'),
    tagPillsContainer: document.getElementById('popular-tags-pills'),
    activeFiltersBar: document.getElementById('active-filters-bar'),
    filterSummaryText: document.getElementById('filter-summary-text'),
    clearAllFiltersBtn: document.getElementById('clear-all-filters-btn'),

    // Snippets List & State
    snippetsGrid: document.getElementById('snippets-grid'),
    loadingState: document.getElementById('loading-state'),
    emptyState: document.getElementById('empty-state'),
    resultsCount: document.getElementById('results-count'),

    // Form Modal (Create / Edit)
    snippetModal: document.getElementById('snippet-form-modal'),
    modalTitle: document.getElementById('form-modal-title'),
    snippetForm: document.getElementById('snippet-form'),
    formIdInput: document.getElementById('snippet-id-input'),
    formTitleInput: document.getElementById('form-title'),
    formAuthorInput: document.getElementById('form-author'),
    formLangSelect: document.getElementById('form-language'),
    formTagsInput: document.getElementById('form-tags'),
    formDescInput: document.getElementById('form-description'),
    formCodeInput: document.getElementById('form-code'),
    formSubmitBtn: document.getElementById('form-submit-btn'),
    closeFormModalBtn: document.getElementById('close-form-modal-btn'),
    cancelFormBtn: document.getElementById('cancel-form-btn'),

    // View Detail Modal
    viewModal: document.getElementById('snippet-view-modal'),
    viewTitle: document.getElementById('view-title'),
    viewMeta: document.getElementById('view-meta'),
    viewLangPill: document.getElementById('view-lang-pill'),
    viewDescription: document.getElementById('view-description'),
    viewTags: document.getElementById('view-tags'),
    viewCodeContainer: document.getElementById('view-code-container'),
    viewCopyBtn: document.getElementById('view-copy-btn'),
    viewDownloadBtn: document.getElementById('view-download-btn'),
    viewEditBtn: document.getElementById('view-edit-btn'),
    viewDeleteBtn: document.getElementById('view-delete-btn'),
    closeViewModalBtn: document.getElementById('close-view-modal-btn'),

    // Delete Modal
    deleteModal: document.getElementById('delete-confirm-modal'),
    deleteSnippetName: document.getElementById('delete-snippet-name'),
    confirmDeleteBtn: document.getElementById('confirm-delete-btn'),
    cancelDeleteBtn: document.getElementById('cancel-delete-btn'),
    closeDeleteModalBtn: document.getElementById('close-delete-modal-btn'),

    // Header actions
    newSnippetBtn: document.getElementById('new-snippet-btn'),
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    reseedBtn: document.getElementById('reseed-btn'),
    emptyCreateBtn: document.getElementById('empty-create-btn')
};

/**
 * Initialize Platform
 */
async function init() {
    applyTheme(state.theme);
    setupEventListeners();
    await loadInitialData();
}

/**
 * Apply theme to document
 */
function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sh_theme', theme);

    if (elements.themeToggleBtn) {
        elements.themeToggleBtn.setAttribute('title', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    }
}

/**
 * Load stats, languages, tags, and snippet list
 */
async function loadInitialData() {
    showLoading(true);
    try {
        await Promise.all([
            loadStats(),
            loadLanguagesDropdown(),
            loadPopularTags(),
            loadSnippets()
        ]);
    } catch (err) {
        console.error('Failed to load initial data:', err);
        showToast('Failed to load platform data. Please refresh.', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Refresh Platform Stats
 */
async function loadStats() {
    try {
        const stats = await api.getStats();
        if (elements.statSnippets) elements.statSnippets.textContent = stats.totalSnippets ?? 0;
        if (elements.statLanguages) elements.statLanguages.textContent = stats.totalLanguages ?? 0;
        if (elements.statTags) elements.statTags.textContent = stats.totalTags ?? 0;
        if (elements.statAuthors) elements.statAuthors.textContent = stats.totalAuthors ?? 0;
    } catch (err) {
        console.error('Error fetching stats:', err);
    }
}

/**
 * Load languages list into filter dropdown
 */
async function loadLanguagesDropdown() {
    try {
        const languages = await api.getLanguages();
        if (!elements.languageSelect) return;

        const currentVal = elements.languageSelect.value;
        elements.languageSelect.innerHTML = '<option value="">All Languages</option>';

        languages.forEach(item => {
            const opt = document.createElement('option');
            opt.value = item.language;
            opt.textContent = `${item.language} (${item.count})`;
            elements.languageSelect.appendChild(opt);
        });

        elements.languageSelect.value = currentVal;
    } catch (err) {
        console.error('Error loading languages:', err);
    }
}

/**
 * Load popular tags into filter pills
 */
async function loadPopularTags() {
    try {
        const tags = await api.getTags();
        if (!elements.tagPillsContainer) return;

        elements.tagPillsContainer.innerHTML = '';
        if (tags.length === 0) {
            elements.tagPillsContainer.innerHTML = '<span class="text-muted-tag">No tags yet</span>';
            return;
        }

        // Show top 15 tags
        tags.slice(0, 15).forEach(({ tag, count }) => {
            const btn = document.createElement('button');
            const isActive = state.filters.tag.toLowerCase() === tag.toLowerCase();
            btn.className = `tag-chip ${isActive ? 'active' : ''}`;
            btn.dataset.tag = tag;
            btn.innerHTML = `#${escapeHtml(tag)} <span class="tag-chip-count">${count}</span>`;
            elements.tagPillsContainer.appendChild(btn);
        });
    } catch (err) {
        console.error('Error loading tags:', err);
    }
}

/**
 * Load snippets matching current state filters
 */
async function loadSnippets() {
    showLoading(true);
    try {
        const snippets = await api.getSnippets(state.filters);
        state.snippets = snippets;
        renderSnippetsList();
        updateActiveFiltersDisplay();
    } catch (err) {
        console.error('Error loading snippets:', err);
        showToast('Error loading snippets: ' + err.message, 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Render snippets cards into grid
 */
function renderSnippetsList() {
    if (!elements.snippetsGrid) return;

    if (elements.resultsCount) {
        elements.resultsCount.textContent = `${state.snippets.length} snippet${state.snippets.length === 1 ? '' : 's'}`;
    }

    if (state.snippets.length === 0) {
        elements.snippetsGrid.innerHTML = '';
        if (elements.emptyState) elements.emptyState.style.display = 'flex';
        return;
    }

    if (elements.emptyState) elements.emptyState.style.display = 'none';
    elements.snippetsGrid.innerHTML = state.snippets.map(renderSnippetCard).join('');
}

/**
 * Update active filters bar indicator
 */
function updateActiveFiltersDisplay() {
    const { search, language, tag } = state.filters;
    const hasActiveFilters = Boolean(search || language || tag);

    if (elements.activeFiltersBar) {
        elements.activeFiltersBar.style.display = hasActiveFilters ? 'flex' : 'none';
    }

    if (hasActiveFilters && elements.filterSummaryText) {
        const parts = [];
        if (search) parts.push(`Query: "<strong>${escapeHtml(search)}</strong>"`);
        if (language) parts.push(`Language: <strong>${escapeHtml(language)}</strong>`);
        if (tag) parts.push(`Tag: <strong>#${escapeHtml(tag)}</strong>`);
        elements.filterSummaryText.innerHTML = `Filtered by: ${parts.join(' • ')}`;
    }

    if (elements.clearSearchBtn) {
        elements.clearSearchBtn.style.display = search ? 'block' : 'none';
    }

    // Highlight active tag chip in tags cloud
    if (elements.tagPillsContainer) {
        elements.tagPillsContainer.querySelectorAll('.tag-chip').forEach(chip => {
            if (chip.dataset.tag.toLowerCase() === (tag || '').toLowerCase()) {
                chip.classList.add('active');
            } else {
                chip.classList.remove('active');
            }
        });
    }
}

/**
 * Show / hide loading spinner
 */
function showLoading(show) {
    if (elements.loadingState) {
        elements.loadingState.style.display = show ? 'flex' : 'none';
    }
    if (show && elements.emptyState) {
        elements.emptyState.style.display = 'none';
    }
}

/**
 * Setup All Event Listeners
 */
function setupEventListeners() {
    // Theme toggle
    if (elements.themeToggleBtn) {
        elements.themeToggleBtn.addEventListener('click', () => {
            const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
            applyTheme(nextTheme);
        });
    }

    // Reseed button
    if (elements.reseedBtn) {
        elements.reseedBtn.addEventListener('click', async () => {
            if (confirm('Reset platform data to default sample snippets? Custom changes will be overwritten.')) {
                try {
                    await api.reseed();
                    showToast('Platform reset to sample snippets!', 'success');
                    await loadInitialData();
                } catch (err) {
                    showToast('Reseed failed: ' + err.message, 'error');
                }
            }
        });
    }

    // Search input (debounced)
    let searchTimeout;
    if (elements.searchInput) {
        elements.searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                state.filters.search = e.target.value.trim();
                loadSnippets();
            }, 300);
        });
    }

    // Clear search button
    if (elements.clearSearchBtn) {
        elements.clearSearchBtn.addEventListener('click', () => {
            elements.searchInput.value = '';
            state.filters.search = '';
            loadSnippets();
            elements.searchInput.focus();
        });
    }

    // Language dropdown filter
    if (elements.languageSelect) {
        elements.languageSelect.addEventListener('change', (e) => {
            state.filters.language = e.target.value;
            loadSnippets();
        });
    }

    // Sort dropdown
    if (elements.sortSelect) {
        elements.sortSelect.addEventListener('change', (e) => {
            state.filters.sort = e.target.value;
            loadSnippets();
        });
    }

    // Clear all filters button
    if (elements.clearAllFiltersBtn) {
        elements.clearAllFiltersBtn.addEventListener('click', () => {
            state.filters.search = '';
            state.filters.language = '';
            state.filters.tag = '';
            if (elements.searchInput) elements.searchInput.value = '';
            if (elements.languageSelect) elements.languageSelect.value = '';
            loadSnippets();
        });
    }

    // Click on popular tag chip
    if (elements.tagPillsContainer) {
        elements.tagPillsContainer.addEventListener('click', (e) => {
            const chip = e.target.closest('.tag-chip');
            if (!chip) return;
            const clickedTag = chip.dataset.tag;
            if (state.filters.tag.toLowerCase() === clickedTag.toLowerCase()) {
                state.filters.tag = ''; // Toggle off
            } else {
                state.filters.tag = clickedTag;
            }
            loadSnippets();
        });
    }

    // Snippets grid actions delegation (View, Edit, Delete, Copy, Tag Click)
    if (elements.snippetsGrid) {
        elements.snippetsGrid.addEventListener('click', async (e) => {
            // Copy code action
            const copyBtn = e.target.closest('.copy-snippet-btn');
            if (copyBtn) {
                e.stopPropagation();
                const id = Number(copyBtn.dataset.id);
                const snippet = state.snippets.find(s => s.id === id);
                if (snippet) {
                    await copyToClipboard(snippet.code);
                    showToast('Snippet code copied to clipboard!', 'success');
                }
                return;
            }

            // Filter by tag badge
            const tagBtn = e.target.closest('.filter-tag-btn');
            if (tagBtn) {
                e.stopPropagation();
                const tag = tagBtn.dataset.tag;
                state.filters.tag = tag;
                loadSnippets();
                return;
            }

            // Edit button
            const editBtn = e.target.closest('.edit-snippet-btn');
            if (editBtn) {
                e.stopPropagation();
                const id = Number(editBtn.dataset.id);
                openEditModal(id);
                return;
            }

            // Delete button
            const deleteBtn = e.target.closest('.delete-snippet-btn');
            if (deleteBtn) {
                e.stopPropagation();
                const id = Number(deleteBtn.dataset.id);
                openDeleteModal(id);
                return;
            }

            // View snippet (by clicking card title, code preview, or view button)
            const viewTrigger = e.target.closest('.view-trigger, .view-snippet-btn');
            if (viewTrigger) {
                const id = Number(viewTrigger.dataset.id);
                openViewModal(id);
                return;
            }
        });
    }

    // Open create modal buttons
    if (elements.newSnippetBtn) {
        elements.newSnippetBtn.addEventListener('click', () => openCreateModal());
    }
    if (elements.emptyCreateBtn) {
        elements.emptyCreateBtn.addEventListener('click', () => openCreateModal());
    }

    // Close Create/Edit Modal
    if (elements.closeFormModalBtn) {
        elements.closeFormModalBtn.addEventListener('click', () => closeFormModal());
    }
    if (elements.cancelFormBtn) {
        elements.cancelFormBtn.addEventListener('click', () => closeFormModal());
    }

    // Form Submit (Create or Update)
    if (elements.snippetForm) {
        elements.snippetForm.addEventListener('submit', handleFormSubmit);
    }

    // Allow tab indentation inside code editor textarea
    if (elements.formCodeInput) {
        elements.formCodeInput.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = elements.formCodeInput.selectionStart;
                const end = elements.formCodeInput.selectionEnd;
                const val = elements.formCodeInput.value;
                elements.formCodeInput.value = val.substring(0, start) + '    ' + val.substring(end);
                elements.formCodeInput.selectionStart = elements.formCodeInput.selectionEnd = start + 4;
            }
        });
    }

    // View Modal Actions
    if (elements.closeViewModalBtn) {
        elements.closeViewModalBtn.addEventListener('click', () => closeViewModal());
    }
    if (elements.viewCopyBtn) {
        elements.viewCopyBtn.addEventListener('click', async () => {
            if (state.currentViewingSnippet) {
                await copyToClipboard(state.currentViewingSnippet.code);
                showToast('Snippet code copied to clipboard!', 'success');
            }
        });
    }
    if (elements.viewDownloadBtn) {
        elements.viewDownloadBtn.addEventListener('click', () => {
            if (state.currentViewingSnippet) {
                downloadSnippetFile(state.currentViewingSnippet);
            }
        });
    }
    if (elements.viewEditBtn) {
        elements.viewEditBtn.addEventListener('click', () => {
            if (state.currentViewingSnippet) {
                const id = state.currentViewingSnippet.id;
                closeViewModal();
                openEditModal(id);
            }
        });
    }
    if (elements.viewDeleteBtn) {
        elements.viewDeleteBtn.addEventListener('click', () => {
            if (state.currentViewingSnippet) {
                const id = state.currentViewingSnippet.id;
                closeViewModal();
                openDeleteModal(id);
            }
        });
    }

    // Delete Modal Actions
    if (elements.cancelDeleteBtn) {
        elements.cancelDeleteBtn.addEventListener('click', () => closeDeleteModal());
    }
    if (elements.closeDeleteModalBtn) {
        elements.closeDeleteModalBtn.addEventListener('click', () => closeDeleteModal());
    }
    if (elements.confirmDeleteBtn) {
        elements.confirmDeleteBtn.addEventListener('click', handleConfirmDelete);
    }

    // Close modals on clicking backdrop
    [elements.snippetModal, elements.viewModal, elements.deleteModal].forEach(modal => {
        if (!modal) return;
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeAllModals();
            }
        });
    });

    // Close modals on Escape key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

/**
 * Open Create Snippet Modal
 */
function openCreateModal() {
    state.currentEditingId = null;
    elements.snippetForm.reset();
    elements.formIdInput.value = '';
    elements.modalTitle.textContent = 'Create New Snippet';
    elements.formSubmitBtn.textContent = 'Create Snippet';
    elements.snippetModal.classList.add('active');
    setTimeout(() => elements.formTitleInput.focus(), 100);
}

/**
 * Open Edit Snippet Modal
 */
async function openEditModal(id) {
    try {
        let snippet = state.snippets.find(s => s.id === id);
        if (!snippet) {
            snippet = await api.getSnippet(id);
        }

        state.currentEditingId = id;
        elements.formIdInput.value = snippet.id;
        elements.formTitleInput.value = snippet.title;
        elements.formAuthorInput.value = snippet.author;
        elements.formLangSelect.value = snippet.language;
        elements.formTagsInput.value = Array.isArray(snippet.tags) ? snippet.tags.join(', ') : (snippet.tags || '');
        elements.formDescInput.value = snippet.description || '';
        elements.formCodeInput.value = snippet.code;

        elements.modalTitle.textContent = 'Edit Snippet';
        elements.formSubmitBtn.textContent = 'Save Changes';
        elements.snippetModal.classList.add('active');
        setTimeout(() => elements.formTitleInput.focus(), 100);
    } catch (err) {
        showToast('Failed to load snippet: ' + err.message, 'error');
    }
}

/**
 * Close Form Modal
 */
function closeFormModal() {
    elements.snippetModal.classList.remove('active');
    state.currentEditingId = null;
    elements.snippetForm.reset();
}

/**
 * Handle Snippet Form Submit (Create or Update)
 */
async function handleFormSubmit(e) {
    e.preventDefault();

    const title = elements.formTitleInput.value.trim();
    const author = elements.formAuthorInput.value.trim();
    const language = elements.formLangSelect.value.trim();
    const tagsRaw = elements.formTagsInput.value.trim();
    const description = elements.formDescInput.value.trim();
    const code = elements.formCodeInput.value;

    if (!title || !author || !language || !code.trim()) {
        showToast('Please fill in all required fields (Title, Author, Language, Code).', 'error');
        return;
    }

    const tags = tagsRaw
        ? tagsRaw.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
        : [];

    const payload = {
        title,
        author,
        language,
        tags,
        description,
        code
    };

    elements.formSubmitBtn.disabled = true;
    elements.formSubmitBtn.textContent = state.currentEditingId ? 'Saving...' : 'Creating...';

    try {
        if (state.currentEditingId) {
            await api.updateSnippet(state.currentEditingId, payload);
            showToast('Snippet updated successfully!', 'success');
        } else {
            await api.createSnippet(payload);
            showToast('Snippet created successfully!', 'success');
        }

        closeFormModal();
        await Promise.all([
            loadSnippets(),
            loadStats(),
            loadLanguagesDropdown(),
            loadPopularTags()
        ]);
    } catch (err) {
        showToast('Error saving snippet: ' + err.message, 'error');
    } finally {
        elements.formSubmitBtn.disabled = false;
        elements.formSubmitBtn.textContent = state.currentEditingId ? 'Save Changes' : 'Create Snippet';
    }
}

/**
 * Open View Detail Modal
 */
async function openViewModal(id) {
    try {
        let snippet = state.snippets.find(s => s.id === id);
        if (!snippet) {
            snippet = await api.getSnippet(id);
        }

        state.currentViewingSnippet = snippet;

        const langInfo = getLanguageInfo(snippet.language);
        const timeAgo = formatTimeAgo(snippet.created_at);

        elements.viewTitle.textContent = snippet.title;
        elements.viewLangPill.textContent = langInfo.name;
        elements.viewLangPill.style.color = langInfo.color;
        elements.viewLangPill.style.backgroundColor = langInfo.bg;

        elements.viewMeta.innerHTML = `
            <span>Author: <strong>${escapeHtml(snippet.author)}</strong></span>
            <span>•</span>
            <span>Created ${timeAgo}</span>
            ${snippet.updated_at && snippet.updated_at !== snippet.created_at ? `
                <span>•</span>
                <span>Updated ${formatTimeAgo(snippet.updated_at)}</span>
            ` : ''}
        `;

        if (snippet.description) {
            elements.viewDescription.style.display = 'block';
            elements.viewDescription.textContent = snippet.description;
        } else {
            elements.viewDescription.style.display = 'none';
        }

        const tags = Array.isArray(snippet.tags) ? snippet.tags : [];
        if (tags.length > 0) {
            elements.viewTags.style.display = 'flex';
            elements.viewTags.innerHTML = tags.map(t => `<span class="tag-badge">#${escapeHtml(t)}</span>`).join('');
        } else {
            elements.viewTags.style.display = 'none';
        }

        // Render full highlighted code with line numbers
        elements.viewCodeContainer.innerHTML = renderCodeBlockWithNumbers(snippet.code, snippet.language);

        elements.viewModal.classList.add('active');
    } catch (err) {
        showToast('Failed to view snippet: ' + err.message, 'error');
    }
}

/**
 * Close View Modal
 */
function closeViewModal() {
    elements.viewModal.classList.remove('active');
    state.currentViewingSnippet = null;
}

/**
 * Open Delete Modal
 */
function openDeleteModal(id) {
    const snippet = state.snippets.find(s => s.id === id);
    state.deleteTargetId = id;

    if (snippet && elements.deleteSnippetName) {
        elements.deleteSnippetName.textContent = `"${snippet.title}"`;
    }

    elements.deleteModal.classList.add('active');
}

/**
 * Close Delete Modal
 */
function closeDeleteModal() {
    elements.deleteModal.classList.remove('active');
    state.deleteTargetId = null;
}

/**
 * Confirm and execute deletion
 */
async function handleConfirmDelete() {
    if (!state.deleteTargetId) return;

    elements.confirmDeleteBtn.disabled = true;
    elements.confirmDeleteBtn.textContent = 'Deleting...';

    try {
        await api.deleteSnippet(state.deleteTargetId);
        showToast('Snippet deleted successfully.', 'success');
        closeDeleteModal();

        await Promise.all([
            loadSnippets(),
            loadStats(),
            loadLanguagesDropdown(),
            loadPopularTags()
        ]);
    } catch (err) {
        showToast('Failed to delete snippet: ' + err.message, 'error');
    } finally {
        elements.confirmDeleteBtn.disabled = false;
        elements.confirmDeleteBtn.textContent = 'Delete Snippet';
    }
}

/**
 * Close all active modals
 */
function closeAllModals() {
    closeFormModal();
    closeViewModal();
    closeDeleteModal();
}

/**
 * Copy string to clipboard with fallback
 */
async function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
    } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
    }
}

/**
 * Download snippet as a file
 */
function downloadSnippetFile(snippet) {
    const langInfo = getLanguageInfo(snippet.language);
    const safeTitle = snippet.title.toLowerCase().replace(/[^a-z0-9_-]/g, '_').slice(0, 30);
    const fileName = `${safeTitle || 'snippet'}.${langInfo.ext}`;

    const blob = new Blob([snippet.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`Downloaded as ${fileName}`, 'success');
}

// Start app on DOMContentLoaded
document.addEventListener('DOMContentLoaded', init);
