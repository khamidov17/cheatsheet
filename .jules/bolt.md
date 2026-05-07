## 2025-05-15 - Initial Performance Audit
**Learning:** Found that the application performs full-history network syncs and landing page re-renders on every keystroke in the editor. This causes significant network overhead and blocks the main thread with redundant DOM manipulations and synchronous filesystem writes (in local mode).
**Action:** Implement debouncing for history persistence and only trigger UI updates when necessary.
