## 2026-05-25 - Debouncing and UI Sync Optimization
**Learning:** In a single-page application with multiple views (landing, editor), triggering global UI updates (like history grid re-renders) on every document save (which happens on every keystroke) is a significant performance bottleneck. Additionally, standard fetch requests may be cancelled if the page is closed before they complete.

**Action:**
1. Implement a robust `debounce` utility to group rapid state updates.
2. Use the `keepalive: true` flag in fetch requests for critical persistence to ensure completion during page unload.
3. Flush debounced operations on `beforeunload`.
4. Conditionally trigger expensive UI updates (e.g., `renderHistory`) only when the relevant view is active.
