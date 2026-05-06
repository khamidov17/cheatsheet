## 2026-05-06 - [Excessive API calls on document edit]
**Learning:** The application was calling `saveHistory()` on every 'input' event in the editor. Since `saveHistory` triggers two POST requests (one for user history if logged in, and one for device history), this resulted in a flood of network traffic during typing, leading to potential race conditions and unnecessary server load.
**Action:** Implement debouncing for the history saving mechanism to batch updates and reduce network overhead.
