## 2026-06-06 - Keystroke-triggered Network Requests
**Learning:** The 'input' event in `renderCanvasNodes` triggers `saveCurrentDocument()` on every keystroke, which results in immediate network requests to `/api/user/:email/history` and `/api/device/:deviceId/history`. This causes massive overhead and potential race conditions.
**Action:** Implement debouncing for document persistence to batch updates and reduce network traffic during active editing.
