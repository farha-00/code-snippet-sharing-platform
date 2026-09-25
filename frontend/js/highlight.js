/**
 * Clean, zero-dependency client-side syntax highlighter
 * Supports keywords, strings, comments, numbers, booleans, and functions
 * across JavaScript, TypeScript, Python, SQL, Rust, Go, CSS, HTML, and more.
 */

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

const LANGUAGE_DEFINITIONS = {
    javascript: {
        keywords: [
            'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue',
            'debugger', 'default', 'delete', 'do', 'else', 'export', 'extends',
            'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'new',
            'return', 'super', 'switch', 'this', 'throw', 'try', 'typeof', 'var',
            'void', 'while', 'with', 'yield', 'let', 'static', 'of', 'from'
        ],
        booleans: ['true', 'false', 'null', 'undefined', 'NaN', 'Infinity'],
        commentLine: '//',
        commentBlock: ['/*', '*/']
    },
    typescript: {
        keywords: [
            'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue',
            'debugger', 'default', 'delete', 'do', 'else', 'export', 'extends',
            'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'new',
            'return', 'super', 'switch', 'this', 'throw', 'try', 'typeof', 'var',
            'while', 'let', 'interface', 'type', 'enum', 'implements', 'declare',
            'abstract', 'as', 'readonly', 'public', 'private', 'protected', 'from'
        ],
        booleans: ['true', 'false', 'null', 'undefined', 'NaN', 'never', 'unknown', 'any'],
        commentLine: '//',
        commentBlock: ['/*', '*/']
    },
    python: {
        keywords: [
            'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue',
            'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from',
            'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not',
            'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield'
        ],
        booleans: ['True', 'False', 'None'],
        commentLine: '#',
        decorators: true
    },
    sql: {
        keywords: [
            'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'UPDATE', 'DELETE',
            'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'OUTER', 'ON', 'GROUP',
            'BY', 'HAVING', 'ORDER', 'ASC', 'DESC', 'LIMIT', 'OFFSET', 'UNION',
            'ALL', 'CREATE', 'TABLE', 'DROP', 'ALTER', 'INDEX', 'PRIMARY', 'KEY',
            'FOREIGN', 'REFERENCES', 'VALUES', 'SET', 'AND', 'OR', 'NOT', 'NULL',
            'AS', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'LIKE', 'IN',
            'BETWEEN', 'EXISTS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'WITH',
            'RECURSIVE', 'CAST', 'VARCHAR', 'INTEGER', 'TEXT', 'DATETIME', 'BOOLEAN'
        ],
        booleans: ['TRUE', 'FALSE', 'NULL'],
        commentLine: '--',
        commentBlock: ['/*', '*/']
    },
    rust: {
        keywords: [
            'as', 'async', 'await', 'break', 'const', 'continue', 'crate', 'dyn',
            'else', 'enum', 'extern', 'false', 'fn', 'for', 'if', 'impl', 'in',
            'let', 'loop', 'match', 'mod', 'move', 'mut', 'pub', 'ref', 'return',
            'self', 'Self', 'static', 'struct', 'super', 'trait', 'true', 'type',
            'unsafe', 'use', 'where', 'while'
        ],
        booleans: ['true', 'false', 'Some', 'None', 'Ok', 'Err'],
        commentLine: '//',
        commentBlock: ['/*', '*/']
    },
    go: {
        keywords: [
            'break', 'case', 'chan', 'const', 'continue', 'default', 'defer',
            'else', 'fallthrough', 'for', 'func', 'go', 'goto', 'if', 'import',
            'interface', 'map', 'package', 'range', 'return', 'select', 'struct',
            'switch', 'type', 'var'
        ],
        booleans: ['true', 'false', 'nil', 'iota'],
        commentLine: '//',
        commentBlock: ['/*', '*/']
    },
    css: {
        keywords: [
            'important', 'inherit', 'initial', 'unset', 'auto', 'none', 'media',
            'keyframes', 'root', 'hover', 'active', 'focus', 'before', 'after'
        ],
        booleans: [],
        commentLine: null,
        commentBlock: ['/*', '*/']
    }
};

// Aliases
LANGUAGE_DEFINITIONS.js = LANGUAGE_DEFINITIONS.javascript;
LANGUAGE_DEFINITIONS.ts = LANGUAGE_DEFINITIONS.typescript;
LANGUAGE_DEFINITIONS.py = LANGUAGE_DEFINITIONS.python;
LANGUAGE_DEFINITIONS.golang = LANGUAGE_DEFINITIONS.go;
LANGUAGE_DEFINITIONS.rs = LANGUAGE_DEFINITIONS.rust;

/**
 * Highlight a line of code according to language rules
 */
export function highlightCode(rawCode, language = '') {
    if (!rawCode) return '';
    const langKey = (language || '').toLowerCase().trim();
    const lang = LANGUAGE_DEFINITIONS[langKey] || LANGUAGE_DEFINITIONS.javascript;

    const lines = rawCode.split('\n');
    let inBlockComment = false;

    const highlightedLines = lines.map(line => {
        let result = '';
        let i = 0;
        const len = line.length;

        while (i < len) {
            // Check block comment continuation
            if (inBlockComment) {
                const endIdx = line.indexOf('*/', i);
                if (endIdx !== -1) {
                    result += `<span class="token-comment">${escapeHtml(line.slice(i, endIdx + 2))}</span>`;
                    i = endIdx + 2;
                    inBlockComment = false;
                } else {
                    result += `<span class="token-comment">${escapeHtml(line.slice(i))}</span>`;
                    i = len;
                }
                continue;
            }

            // Check start of block comment
            if (lang.commentBlock && line.slice(i, i + 2) === lang.commentBlock[0]) {
                const endIdx = line.indexOf(lang.commentBlock[1], i + 2);
                if (endIdx !== -1) {
                    result += `<span class="token-comment">${escapeHtml(line.slice(i, endIdx + 2))}</span>`;
                    i = endIdx + 2;
                } else {
                    result += `<span class="token-comment">${escapeHtml(line.slice(i))}</span>`;
                    i = len;
                    inBlockComment = true;
                }
                continue;
            }

            // Check single line comment
            if (lang.commentLine && line.startsWith(lang.commentLine, i)) {
                result += `<span class="token-comment">${escapeHtml(line.slice(i))}</span>`;
                i = len;
                continue;
            }

            // Check strings: "", '', or ``
            const char = line[i];
            if (char === '"' || char === "'" || char === '`') {
                const quote = char;
                let strEnd = i + 1;
                while (strEnd < len) {
                    if (line[strEnd] === '\\') {
                        strEnd += 2;
                        continue;
                    }
                    if (line[strEnd] === quote) {
                        strEnd++;
                        break;
                    }
                    strEnd++;
                }
                result += `<span class="token-string">${escapeHtml(line.slice(i, strEnd))}</span>`;
                i = strEnd;
                continue;
            }

            // Check Python decorators
            if (lang.decorators && char === '@' && (i === 0 || /\s/.test(line[i - 1]))) {
                let decEnd = i + 1;
                while (decEnd < len && /[a-zA-Z0-9_.]/.test(line[decEnd])) {
                    decEnd++;
                }
                result += `<span class="token-decorator">${escapeHtml(line.slice(i, decEnd))}</span>`;
                i = decEnd;
                continue;
            }

            // Check numbers
            if (/[0-9]/.test(char) && (i === 0 || /[^a-zA-Z0-9_]/.test(line[i - 1]))) {
                let numEnd = i;
                while (numEnd < len && /[0-9a-fA-FxX._]/.test(line[numEnd])) {
                    numEnd++;
                }
                result += `<span class="token-number">${escapeHtml(line.slice(i, numEnd))}</span>`;
                i = numEnd;
                continue;
            }

            // Check words (keywords, booleans, functions, identifiers)
            if (/[a-zA-Z_$]/.test(char)) {
                let wordEnd = i;
                while (wordEnd < len && /[a-zA-Z0-9_$]/.test(line[wordEnd])) {
                    wordEnd++;
                }
                const word = line.slice(i, wordEnd);
                const isSql = langKey === 'sql';
                const compWord = isSql ? word.toUpperCase() : word;

                if (lang.keywords && lang.keywords.includes(compWord)) {
                    result += `<span class="token-keyword">${escapeHtml(word)}</span>`;
                } else if (lang.booleans && lang.booleans.includes(compWord)) {
                    result += `<span class="token-boolean">${escapeHtml(word)}</span>`;
                } else if (line[wordEnd] === '(') {
                    result += `<span class="token-function">${escapeHtml(word)}</span>`;
                } else {
                    result += escapeHtml(word);
                }
                i = wordEnd;
                continue;
            }

            // Default regular character
            result += escapeHtml(char);
            i++;
        }

        return result || '&nbsp;';
    });

    return highlightedLines;
}

/**
 * Render complete code block with line numbers
 */
export function renderCodeBlockWithNumbers(rawCode, language = '') {
    const lines = highlightCode(rawCode, language);
    let output = '<div class="code-container"><table class="code-table"><tbody>';

    lines.forEach((lineHtml, index) => {
        const lineNum = index + 1;
        output += `<tr><td class="line-number" data-line="${lineNum}">${lineNum}</td><td class="line-content">${lineHtml}</td></tr>`;
    });

    output += '</tbody></table></div>';
    return output;
}
