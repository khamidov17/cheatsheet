## 2025-05-15 - Debounced History Saves & Keepalive
**Learning:** In a high-frequency input application like a cheatsheet editor, debouncing state persistence is critical not just for performance, but for data integrity. Combining `debounce` with `fetch`'s `keepalive: true` and a `beforeunload` flush ensures that we don't lose the last few keystrokes when a user suddenly closes the tab, which is a common failure point in client-side persistence logic.
**Action:** Always pair debounced network saves with a `beforeunload` listener and `keepalive` flags for reliable background synchronization.
