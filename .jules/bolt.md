## 2025-05-15 - Optimized Document History Persistence

**Learning:** Sequential network requests and per-keystroke UI re-renders were creating significant lag during document editing. Each character typed triggered two sequential POST requests and a full history grid re-render. Browsers may cancel asynchronous requests during page unload unless 'keepalive: true' is used.

**Action:** Implemented debounced parallel persistence using `Promise.all` and a 1000ms delay. Reduced API traffic and eliminated redundant UI updates by checking view state before re-rendering the history grid. Added `beforeunload` flush with `keepalive: true` to ensure data consistency upon exit.
