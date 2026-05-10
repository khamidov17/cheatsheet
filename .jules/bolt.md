## 2025-05-10 - [Debounced Persistence]
**Learning:** Frequent API calls during active typing can lead to race conditions and excessive server load. Skipping DOM-heavy functions like 'renderHistory' during debounced saves further improves perceived performance.
**Action:** Use debouncing for all auto-save functionality and distinguish between 'soft' saves (typing) and 'hard' saves (state changes) to optimize UI rendering.
