## 2025-05-15 - Persistence Bottleneck & Reliability
**Learning:** Frequent 'input' events were triggering sequential network requests and full UI re-renders, causing significant lag. Additionally, saves could fail if the page was closed during an async operation.
**Action:** Implemented debounced saving (1000ms) with parallel API requests (Promise.all) and 'keepalive: true' to ensure data integrity. Optimized UI by conditionally skipping history re-renders during active editing.
