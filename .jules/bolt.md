## 2025-05-15 - Debouncing State Persistence

**Learning:** This application previously triggered a network request and a full DOM re-render of the history grid for every single 'input' event in the editor. In a typical editing session, this could result in hundreds of unnecessary API calls and significant main-thread overhead, especially for users with many saved cheatsheets.

**Action:** Implement debouncing for all non-critical state persistence. Use `keepalive: true` in fetch requests and flush pending changes on `beforeunload` to ensure reliability without sacrificing performance. Only re-render UI components (like the history grid) when they are actually visible to the user.
