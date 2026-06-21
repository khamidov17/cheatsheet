## 2025-06-21 - Parallelizing Persistence & Debouncing UI Updates
**Learning:** Sequential API calls for history persistence (user + device) were causing latency in the UI. Additionally, rebuilding the history grid on every keystroke was a major bottleneck for editor performance.
**Action:** Used `Promise.all` to parallelize network requests and implemented a conditional UI render check (`view-active`) to skip expensive history re-renders during active document editing.
