## 2025-05-15 - Redundant Sequential History Persistence
**Learning:** The application was performing redundant, sequential POST requests to /api/user and /api/device on every keystroke, causing significant network overhead and potential UI lag.
**Action:** Implemented debounced parallel persistence using Promise.all and conditional UI re-rendering based on view state.
