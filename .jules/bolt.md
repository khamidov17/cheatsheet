# Bolt Journal

## 2025-05-22 - Debounce History Persistence
**Learning:** Sequential network requests on every keystroke and immediate UI re-renders of the history grid during active editing were significant performance bottlenecks, especially with large document payloads. Parallelizing requests with `Promise.all` and debouncing the persistence layer significantly improves responsiveness.
**Action:** Always implement debounced persistence for frequent user inputs (typing) and ensure UI components that are not in view (like a background history list) are not re-rendered unnecessarily.
