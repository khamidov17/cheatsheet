## 2025-05-14 - Reliability in Debounced Persistence

**Learning:** When implementing debouncing for data persistence (like saving document history), there is a high risk of data loss if the user navigates away or closes the tab while a save is pending. Combining debouncing with a `beforeunload` listener to flush pending saves and using the `keepalive: true` fetch flag ensures that critical data is persisted even during session termination.

**Action:** Always use `keepalive: true` for background synchronization tasks and provide a mechanism to flush debounced queues on page exit.
