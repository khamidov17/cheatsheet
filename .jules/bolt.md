## 2025-05-15 - Debouncing History Persistence
**Learning:** Syncing state on every keystroke causes significant performance bottlenecks due to excessive API calls and UI re-renders. Using `keepalive: true` in fetch and flushing pending saves on `beforeunload` ensures data reliability while maintaining performance.
**Action:** Always implement debounced saves for text-heavy inputs and use the `immediate` flag for discrete UI actions like deletion or reordering.
