## 2025-05-14 - Parallel Persistence & Debouncing
**Learning:** Sequential network requests and full UI re-renders on every keystroke (input event) are major performance killers. Debouncing the persistence layer and parallelizing API calls significantly improves responsiveness.
**Action:** Always debounce frequent events that trigger network I/O or heavy DOM manipulation. Use `Promise.all` for independent API calls.
