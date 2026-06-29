## 2026-06-29 - Parallelized Persistence & Debounced Saving
**Learning:** Identifying a significant performance bottleneck where every keystroke in the document editor triggered immediate, sequential network requests and full UI re-renders of the history grid. Parallelizing the API calls (User + Device history) and debouncing the persistence logic significantly reduces server load and UI jank.
**Action:** Always check for high-frequency events (like `input`) that trigger network or heavy UI work and ensure they are debounced. Parallelize independent API calls to minimize total wait time.
