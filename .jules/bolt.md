## 2025-05-15 - Debounced Parallel Persistence
**Learning:** Sequential network requests and redundant full-UI re-renders on every keystroke create significant main-thread lag and server pressure. Using `Promise.all` for parallel saves and debouncing state snapshots ensures high performance without compromising data integrity.
**Action:** Always debounce persistence of frequently changing state. Use `.flush()` on critical transitions (navigation, creation) and `beforeunload`. Conditionally re-render UI components only when they are actually visible.
