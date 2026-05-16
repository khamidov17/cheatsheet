## 2026-05-16 - Debounced Persistence for Document State
**Learning:** In highly interactive applications with real-time text synchronization, persisting state on every keystroke creates significant network overhead and potential race conditions. Implementing a debounced persistence strategy reduces API calls by orders of magnitude during active typing while maintaining data integrity via lifecycle hooks like 'beforeunload'.
**Action:** Use 'debounce' for frequent state updates and ensure a flush mechanism exists for critical transitions (reordering, navigation, page exit).
