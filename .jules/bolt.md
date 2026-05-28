## 2025-05-28 - Optimizing Editor History Sync
**Learning:** Syncing document state on every keystroke in a web editor creates massive API overhead and unnecessary UI re-renders. A robust solution requires debouncing (1000ms) paired with `keepalive: true` in fetch calls and a `beforeunload` flush mechanism. This ensures server efficiency (reducing requests by ~90% during active typing) without risking data loss during page transitions.
**Action:** Always implement debounced background syncs with `keepalive` and a flush-on-exit listener for critical state persistence in editors.
