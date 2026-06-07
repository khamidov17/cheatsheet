## 2025-05-14 - Robust Debounce Flushing
**Learning:** A standard debounce utility that only flushes if a timeout is pending can cause silent failures for "immediate" actions that aren't preceded by a debounced event.
**Action:** Always implement `.flush()` such that it can execute the target function even if no timeout is pending, or explicitly handle "force save" logic in the persistence layer.
