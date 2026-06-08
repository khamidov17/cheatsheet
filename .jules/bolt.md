## 2025-05-15 - Persistence Layer Optimization

**Learning:** This codebase suffered from a common performance anti-pattern where every keystroke in the editor triggered a sequential, non-parallelized API request to save history, followed by a full UI re-render. This led to excessive network traffic (1 request per character) and potential race conditions if the user navigated away.

**Action:** Implemented a debounced (1000ms) persistence layer that parallelizes API calls to both user and device endpoints using `Promise.all`. Used `keepalive: true` and the `beforeunload` event to ensure data integrity even during page exits. Optimized the UI render path to only refresh the history grid when it is actually visible to the user.

**Measurement:** Reduced API traffic from 16 requests per 16 characters typed to just 2 total requests (1 for document creation, 1 for the debounced save after typing).
