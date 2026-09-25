/**
 * API Client for interacting with Code Snippet Sharing Platform backend
 */

const BASE_URL = '/api';

async function request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const defaultHeaders = {
        'Content-Type': 'application/json'
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `HTTP error: ${response.status}`);
        }

        return data;
    } catch (err) {
        console.error(`API request error on ${url}:`, err);
        throw err;
    }
}

export const api = {
    // Get snippets with optional filters
    async getSnippets({ search = '', language = '', tag = '', sort = 'newest' } = {}) {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (language) params.set('language', language);
        if (tag) params.set('tag', tag);
        if (sort) params.set('sort', sort);

        const qs = params.toString();
        const url = `/snippets${qs ? `?${qs}` : ''}`;
        const res = await request(url);
        return res.data || [];
    },

    // Get single snippet
    async getSnippet(id) {
        const res = await request(`/snippets/${id}`);
        return res.data;
    },

    // Create a new snippet
    async createSnippet(snippetData) {
        const res = await request('/snippets', {
            method: 'POST',
            body: JSON.stringify(snippetData)
        });
        return res.data;
    },

    // Update an existing snippet
    async updateSnippet(id, snippetData) {
        const res = await request(`/snippets/${id}`, {
            method: 'PUT',
            body: JSON.stringify(snippetData)
        });
        return res.data;
    },

    // Delete a snippet
    async deleteSnippet(id) {
        return await request(`/snippets/${id}`, {
            method: 'DELETE'
        });
    },

    // Get all languages with counts
    async getLanguages() {
        const res = await request('/languages');
        return res.data || [];
    },

    // Get all tags with counts
    async getTags() {
        const res = await request('/tags');
        return res.data || [];
    },

    // Get platform stats
    async getStats() {
        const res = await request('/stats');
        return res.data || {};
    },

    // Reseed initial database
    async reseed() {
        return await request('/seed', {
            method: 'POST'
        });
    }
};
