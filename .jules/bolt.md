## 2026-05-30 - Debouncing history persistence
**Learning:** In applications with frequent state updates (like a text editor) that require server-side persistence, debouncing is critical to avoid network congestion and server load. Using `keepalive: true` in `fetch` is a robust way to ensure that "fire-and-forget" persistence requests complete even if the user navigates away or closes the browser.
**Action:** Always consider debouncing for high-frequency events and use `keepalive` for background persistence tasks.
