## 2025-05-14 - Optimized history saving with debouncing
**Learning:** In applications where users perform frequent small updates (like typing), syncing state to the backend on every change can lead to excessive network requests and unnecessary DOM re-renders.
**Action:** Implement debouncing for frequent events and distinguish between structural changes (requiring immediate sync/render) and content changes (safe to debounce).
