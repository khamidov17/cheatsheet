## 2025-05-15 - Redundant Sequential History Persistence
**Learning:** The application was triggering immediate, sequential POST requests to the history API on every keystroke in the editor. This caused a massive amount of network traffic (12 requests for 11 characters) and unnecessary UI re-renders of the history grid.
**Action:** Implemented a debounced persistence strategy (1000ms) that combines user and device history saves into parallel fetch calls using Promise.all. Added an immediate flag to bypass debounce for critical actions (creation, reordering, deletion).
