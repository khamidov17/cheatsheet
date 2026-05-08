## 2025-05-15 - Debounced History Persistence
**Learning:** In highly interactive applications like an editor, synchronous or high-frequency API calls for state persistence can bottleneck the main thread and overwhelm the backend. Implementing a debounced save ensures data safety without sacrificing UI responsiveness.

**Action:** Wrap frequent persistence calls in a debounce utility and provide an 'immediate' flush mechanism for critical state transitions (creation, deletion, reordering) and page exit (via beforeunload).
