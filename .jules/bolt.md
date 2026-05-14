## 2026-05-14 - Debouncing Global State Persistence
**Learning:** In applications where the entire document history is persisted as a single JSON blob on every change, frequent 'input' events (like typing) can lead to O(N) write spikes and UI lag due to excessive API calls and re-renders of the history list.
**Action:** Always debounce persistence logic for high-frequency events. Ensure critical state changes (deletion, reordering) remain immediate for data integrity, and flush pending saves on 'beforeunload'.
