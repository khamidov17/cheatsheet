## 2025-05-15 - Debounced History Persistence
**Learning:** Found a major performance bottleneck where every keystroke in the editor triggered immediate, sequential API calls to save both user and device history, while also forcing a full UI re-render of the history grid. This led to UI lag and unnecessary server load.
**Action:** Implemented a debounced persistence layer (1000ms) and parallelized API requests using Promise.all. Also added conditional UI rendering to skip expensive 'renderHistory()' calls while typing.
