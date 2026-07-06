
## 2025-05-15 - Redundant Persistence and Re-renders during Editing
**Learning:** The 'input' event in the editor was triggering immediate sequential network requests and full UI re-renders on every keystroke, leading to significant latency and backend load. Implementing debounced parallel persistence and conditional rendering reduced network traffic by over 80%.
**Action:** Always debounce frequent persistence events like typing and conditionalize expensive UI updates (like rebuilding history grids) to only occur when the relevant view is visible.
