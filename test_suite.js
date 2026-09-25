// Automated verification suite for Code Snippet Sharing Platform

async function runTests() {
    const baseUrl = 'http://localhost:3000';
    console.log('--- Starting API & Frontend Verification Tests ---');

    let passed = 0;
    let failed = 0;

    async function assert(condition, message) {
        if (condition) {
            console.log(`[PASS] ${message}`);
            passed++;
        } else {
            console.error(`[FAIL] ${message}`);
            failed++;
        }
    }

    try {
        // 1. Check frontend index.html
        const indexRes = await fetch(`${baseUrl}/`);
        const indexText = await indexRes.text();
        await assert(indexRes.status === 200 && indexText.includes('SnippetForge'), 'GET / serves frontend index.html');

        // 2. Check CSS static delivery
        const cssRes = await fetch(`${baseUrl}/css/style.css`);
        const cssText = await cssRes.text();
        await assert(cssRes.status === 200 && cssText.includes('--token-keyword'), 'GET /css/style.css serves CSS stylesheet');

        // 3. Check JS static delivery
        const jsRes = await fetch(`${baseUrl}/js/app.js`);
        const jsText = await jsRes.text();
        await assert(jsRes.status === 200 && jsText.includes('setupEventListeners'), 'GET /js/app.js serves JavaScript module');

        // 4. GET /api/stats
        const statsRes = await fetch(`${baseUrl}/api/stats`);
        const statsData = await statsRes.json();
        await assert(statsRes.status === 200 && statsData.data.totalSnippets >= 7, `GET /api/stats returns stats (count: ${statsData.data?.totalSnippets})`);

        // 5. GET /api/languages
        const langRes = await fetch(`${baseUrl}/api/languages`);
        const langData = await langRes.json();
        await assert(langRes.status === 200 && langData.data.length > 0, `GET /api/languages returns languages list (${langData.data?.length} languages)`);

        // 6. GET /api/tags
        const tagRes = await fetch(`${baseUrl}/api/tags`);
        const tagData = await tagRes.json();
        await assert(tagRes.status === 200 && tagData.data.length > 0, `GET /api/tags returns tags list (${tagData.data?.length} tags)`);

        // 7. GET /api/snippets
        const snippetsRes = await fetch(`${baseUrl}/api/snippets`);
        const snippetsData = await snippetsRes.json();
        await assert(snippetsRes.status === 200 && snippetsData.data.length >= 7, `GET /api/snippets returns snippets list (${snippetsData.data?.length} items)`);

        // 8. Search filter: search=decorator
        const searchRes = await fetch(`${baseUrl}/api/snippets?search=decorator`);
        const searchData = await searchRes.json();
        await assert(searchData.data.length > 0 && searchData.data[0].title.includes('Decorator'), 'Search by keyword finds matching snippets');

        // 9. Language filter: language=Rust
        const rustRes = await fetch(`${baseUrl}/api/snippets?language=Rust`);
        const rustData = await rustRes.json();
        await assert(rustData.data.length > 0 && rustData.data[0].language === 'Rust', 'Filter by language works correctly');

        // 10. Tag filter: tag=es6
        const tagFilterRes = await fetch(`${baseUrl}/api/snippets?tag=es6`);
        const tagFilterData = await tagFilterRes.json();
        await assert(tagFilterData.data.length > 0 && tagFilterData.data[0].tags.includes('es6'), 'Filter by tag works correctly');

        // 11. Create a new snippet (POST /api/snippets)
        const createPayload = {
            title: 'Test Binary Search Algorithm',
            description: 'A clean binary search implementation in Python for sorted lists.',
            language: 'Python',
            tags: ['algorithms', 'binary-search', 'python'],
            author: 'Ada Lovelace',
            code: `def binary_search(arr, target):\n    low, high = 0, len(arr) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1`
        };

        const createRes = await fetch(`${baseUrl}/api/snippets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(createPayload)
        });
        const createData = await createRes.json();
        const createdId = createData.data?.id;
        await assert(createRes.status === 201 && createdId, `POST /api/snippets created snippet with id ${createdId}`);

        // 12. GET single snippet by ID
        const getOneRes = await fetch(`${baseUrl}/api/snippets/${createdId}`);
        const getOneData = await getOneRes.json();
        await assert(getOneRes.status === 200 && getOneData.data.title === createPayload.title, `GET /api/snippets/:id retrieved newly created snippet`);

        // 13. Update snippet (PUT /api/snippets/:id)
        const updatePayload = {
            ...createPayload,
            title: 'Test Binary Search Algorithm (Updated with Bisect)',
            description: 'Updated description for binary search algorithm test.'
        };
        const updateRes = await fetch(`${baseUrl}/api/snippets/${createdId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatePayload)
        });
        const updateData = await updateRes.json();
        await assert(updateRes.status === 200 && updateData.data.title === updatePayload.title, `PUT /api/snippets/:id updated snippet title successfully`);

        // 14. Delete snippet (DELETE /api/snippets/:id)
        const deleteRes = await fetch(`${baseUrl}/api/snippets/${createdId}`, {
            method: 'DELETE'
        });
        const deleteData = await deleteRes.json();
        await assert(deleteRes.status === 200 && deleteData.success === true, `DELETE /api/snippets/:id deleted snippet successfully`);

        // 15. Verify snippet is gone (404)
        const verifyGoneRes = await fetch(`${baseUrl}/api/snippets/${createdId}`);
        await assert(verifyGoneRes.status === 404, `GET /api/snippets/:id returns 404 after deletion`);

        console.log(`\n--- Verification Summary: ${passed} passed, ${failed} failed ---`);
    } catch (err) {
        console.error('Test execution error:', err);
    }
}

runTests();
