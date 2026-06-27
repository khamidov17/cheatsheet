## 2025-05-15 - Persistence Bottleneck & Sequential I/O
**Learning:** The application was performing sequential network requests for history persistence (user then device) and triggering full UI re-renders (`renderHistory`) on every keystroke in the editor. This caused noticeable lag and redundant server traffic.
**Action:** Implemented debounced parallel persistence using `Promise.all` and a custom `debounce` utility. Added a `force` flag to ensure critical structural changes (reordering, deletion) are persisted immediately while typing remains batched.
