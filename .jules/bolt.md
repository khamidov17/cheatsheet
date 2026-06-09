## 2025-05-14 - Redundant Persistence Requests & UI Re-renders during Typing

**Learning:** The `input` event in `renderCanvasNodes` triggers `saveCurrentDocument()`, which in turn calls `saveHistory()`. `saveHistory()` makes two sequential `fetch` requests (User and Device history) and then calls `renderHistory()`, which re-renders the entire history grid. During rapid typing, this causes a flood of network requests (e.g., 12 requests for 11 characters) and significant UI jank due to constant DOM updates.

**Action:** Implement a debounced persistence flow using `Promise.all` for parallel network requests and conditional UI re-rendering (only when the landing view is visible or after a delay) to ensure smooth performance while maintaining data integrity.
