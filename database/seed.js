import { db, createSnippet } from './db.js';

const initialSnippets = [
    {
        title: 'Deep Clone Object in Modern JavaScript',
        description: 'Using structuredClone() for fast, reliable deep object cloning without external dependencies.',
        language: 'JavaScript',
        tags: ['javascript', 'es6', 'utility', 'objects'],
        author: 'Alex Rivera',
        code: `/**
 * Deep clones an object or array safely
 * using native structuredClone (Node 17+ & Modern Browsers)
 */
function safeDeepClone(source) {
    if (source === null || typeof source !== 'object') {
        return source;
    }
    try {
        return structuredClone(source);
    } catch (err) {
        console.warn('Fallback to JSON clone due to structuredClone error:', err);
        return JSON.parse(JSON.stringify(source));
    }
}

// Example usage:
const userSession = {
    id: 101,
    profile: { name: 'Ada Lovelace', role: 'admin' },
    permissions: ['read', 'write', 'execute'],
    createdAt: new Date()
};

const clonedSession = safeDeepClone(userSession);
clonedSession.profile.role = 'editor';
console.log(userSession.profile.role); // 'admin' (unmodified)`
    },
    {
        title: 'Python Exponential Backoff Retry Decorator',
        description: 'A robust Python decorator implementing exponential backoff with jitter for resilient network requests and API calls.',
        language: 'Python',
        tags: ['python', 'decorators', 'networking', 'resilience', 'api'],
        author: 'Elena Rostova',
        code: `import time
import random
import functools
import logging

logger = logging.getLogger(__name__)

def retry_with_backoff(max_retries=3, base_delay=1.0, backoff_factor=2.0, jitter=True):
    """
    Retry a function call with exponential backoff and jitter.
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            retries = 0
            delay = base_delay
            while True:
                try:
                    return func(*args, **kwargs)
                except Exception as exc:
                    retries += 1
                    if retries > max_retries:
                        logger.error(f"Function {func.__name__} failed after {max_retries} attempts.")
                        raise
                    
                    sleep_time = delay + (random.uniform(0, 0.5) if jitter else 0)
                    logger.warning(
                        f"Attempt {retries} failed ({exc}). Retrying in {sleep_time:.2f}s..."
                    )
                    time.sleep(sleep_time)
                    delay *= backoff_factor
        return wrapper
    return decorator

# Example usage:
@retry_with_backoff(max_retries=3, base_delay=0.5)
def fetch_remote_metrics(endpoint):
    # Simulated unreliable network call
    import urllib.request
    with urllib.request.urlopen(endpoint, timeout=2) as response:
        return response.read()`
    },
    {
        title: 'Recursive Common Table Expression (CTE) in SQL',
        description: 'Generate organizational hierarchy breadcrumbs and reporting chains using recursive SQL.',
        language: 'SQL',
        tags: ['sql', 'database', 'queries', 'cte', 'hierarchy'],
        author: 'Marcus Vance',
        code: `-- Recursive CTE to build employee management hierarchy
WITH RECURSIVE OrgChart AS (
    -- Anchor member: Top-level executives (no manager)
    SELECT 
        employee_id,
        first_name || ' ' || last_name AS full_name,
        manager_id,
        title,
        1 AS org_level,
        CAST(first_name || ' ' || last_name AS VARCHAR(500)) AS reporting_chain
    FROM employees
    WHERE manager_id IS NULL

    UNION ALL

    -- Recursive member: Subordinates
    SELECT 
        e.employee_id,
        e.first_name || ' ' || e.last_name,
        e.manager_id,
        e.title,
        o.org_level + 1,
        CAST(o.reporting_chain || ' -> ' || e.first_name || ' ' || e.last_name AS VARCHAR(500))
    FROM employees e
    INNER JOIN OrgChart o ON e.manager_id = o.employee_id
)
SELECT 
    org_level,
    full_name,
    title,
    reporting_chain
FROM OrgChart
ORDER BY org_level, full_name;`
    },
    {
        title: 'TypeScript Type-Safe Result / Either Pattern',
        description: 'Idiomatic TypeScript Result type for graceful error handling without throwing exceptions.',
        language: 'TypeScript',
        tags: ['typescript', 'types', 'functional-programming', 'error-handling'],
        author: 'Kavita Sharma',
        code: `// Lightweight, zero-dependency Result type for functional error handling
export type Result<T, E = Error> = 
    | { ok: true; value: T; error?: never }
    | { ok: false; error: E; value?: never };

export const Ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const Err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export function safeJsonParse<T = unknown>(jsonString: string): Result<T, Error> {
    try {
        const parsed = JSON.parse(jsonString) as T;
        return Ok(parsed);
    } catch (err) {
        return Err(err instanceof Error ? err : new Error(String(err)));
    }
}

// Usage:
const result = safeJsonParse<{ id: number }>('{"id": 42}');
if (result.ok) {
    console.log('Parsed successfully:', result.value.id);
} else {
    console.error('Failed to parse JSON:', result.error.message);
}`
    },
    {
        title: 'Rust Thread-Safe Counter with AtomicUsize',
        description: 'Lock-free, thread-safe counter implementation in Rust using Arc and AtomicUsize ordering.',
        language: 'Rust',
        tags: ['rust', 'concurrency', 'atomics', 'memory-safety', 'multithreading'],
        author: 'Jonas Lindqvist',
        code: `use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use std::thread;

pub struct SharedCounter {
    count: AtomicUsize,
}

impl SharedCounter {
    pub fn new(initial: usize) -> Self {
        Self {
            count: AtomicUsize::new(initial),
        }
    }

    pub fn increment(&self) -> usize {
        self.count.fetch_add(1, Ordering::SeqCst)
    }

    pub fn get(&self) -> usize {
        self.count.load(Ordering::SeqCst)
    }
}

fn main() {
    let counter = Arc::new(SharedCounter::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter_ref = Arc::clone(&counter);
        handles.push(thread::spawn(move || {
            for _ in 0..100 {
                counter_ref.increment();
            }
        }));
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Final counter value: {}", counter.get()); // 1000
}`
    },
    {
        title: 'Modern CSS Glassmorphism Card Style',
        description: 'Clean glassmorphism backdrop filter with subtle border gradient and dark mode compatibility.',
        language: 'CSS',
        tags: ['css', 'glassmorphism', 'ui-design', 'styling', 'frontend'],
        author: 'Chloe Dupont',
        code: `.glass-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(16px) saturate(180%);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.125);
    padding: 24px;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
    transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.glass-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 14px 40px 0 rgba(0, 0, 0, 0.5);
    border-color: rgba(99, 102, 241, 0.4);
}

.glass-badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    background: rgba(99, 102, 241, 0.15);
    color: #818cf8;
    border: 1px solid rgba(99, 102, 241, 0.3);
}`
    },
    {
        title: 'Go HTTP Server with Graceful Shutdown',
        description: 'Standard library Go HTTP server listening for OS signals (SIGINT, SIGTERM) to gracefully finish active requests.',
        language: 'Go',
        tags: ['go', 'golang', 'http-server', 'concurrency', 'backend'],
        author: 'Devin Zhao',
        code: `package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		fmt.Fprintln(w, "OK")
	})

	server := &http.Server{
		Addr:         ":8080",
		Handler:      mux,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	stopChan := make(chan os.Signal, 1)
	signal.Notify(stopChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		fmt.Printf("Server listening on %s\\n", server.Addr)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			fmt.Printf("Listen error: %s\\n", err)
		}
	}()

	<-stopChan
	fmt.Println("Shutting down server gracefully...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		fmt.Printf("Server forced shutdown: %s\\n", err)
	}
	fmt.Println("Server gracefully stopped.")
}`
    }
];

export function seedDatabase(force = false) {
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM snippets');
    const { count } = countStmt.get();

    if (count > 0 && !force) {
        return { seeded: false, count };
    }

    if (force) {
        db.exec('DELETE FROM snippets');
    }

    for (const snippet of initialSnippets) {
        createSnippet(snippet);
    }

    const newCount = db.prepare('SELECT COUNT(*) as count FROM snippets').get().count;
    console.log(`Database seeded with ${newCount} initial snippets.`);
    return { seeded: true, count: newCount };
}

// Auto-seed if run directly
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
    seedDatabase(true);
}
