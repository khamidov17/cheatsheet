## 2026-06-22 - Optimized Persistence and UI Rendering
**Learning:** Debouncing persistence logic and conditionally skipping UI re-renders significantly reduces network traffic and main thread blocking during rapid user input (typing).
**Action:** Always implement debounced saves for frequent events like 'input' and check for view visibility before triggering expensive DOM updates.
