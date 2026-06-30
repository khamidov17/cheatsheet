## 2025-05-15 - Debounced History Persistence
**Learning:** In a collaborative or state-heavy editor, immediate persistence on every keystroke leads to excessive network traffic (O(n) where n is characters typed) and unnecessary UI re-renders of the history grid.
**Action:** Implement a debounced save mechanism (1000ms) that allows intermediate edits to batch, but provides a `.flush()` for critical transitions (navigation, page exit) and a `force` parameter for immediate state changes (document creation).
