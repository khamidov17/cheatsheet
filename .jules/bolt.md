## 2025-05-15 - Persistence Optimization & Debouncing
**Learning:** The application was making redundant sequential history POST requests (one for user history, one for device history) on every keystroke in the editor. Serial execution of these requests doubled the latency, and the lack of debouncing flooded the server with minor state updates.
**Action:** Implemented a robust `debounce` utility with `.flush()` and `.pending()` methods. Refactored `saveHistory` to parallelize network requests using `Promise.all` and integrated a `beforeunload` listener to ensure data persistence on page exit.
