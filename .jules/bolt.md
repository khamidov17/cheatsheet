## 2025-05-20 - Debounced Parallel Persistence
**Learning:** Redundant sequential network requests and full UI re-renders on every keystroke in the editor created a significant performance bottleneck. Sequential `await` calls for user and device history doubling the latency.
**Action:** Implemented a debounced persistence wrapper with `Promise.all` for parallel API calls. Optimized UI by only calling `renderHistory` when the landing view is active or upon explicit navigation back to landing.
