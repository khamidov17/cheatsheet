## 2025-06-19 - Optimized document persistence and UI rendering
**Learning:** Document persistence was being triggered on every keystroke, leading to excessive network requests and UI re-renders of the history grid. By debouncing persistence and conditionally rendering the UI, performance was significantly improved during active document editing.
**Action:** Always debounce frequent I/O operations and skip UI updates for background views. Use parallel network requests where possible to reduce total wait time.
