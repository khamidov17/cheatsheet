## 2025-05-14 - Optimization of History Persistence

**Learning:** Debouncing document history saves is critical in a text-intensive application to avoid performance bottlenecks and excessive network traffic. In this specific architecture, 'saveCurrentDocument' was being triggered on every keystroke, which led to high server-side load and potential UI lag. Adding 'keepalive: true' and a 'beforeunload' listener ensures that these debounced saves are successfully completed even if the user exits the page.

**Action:** Always debounce events that trigger network requests or expensive state updates (like persistence) during active user input. Use 'keepalive' flags and 'beforeunload' listeners to guarantee critical state persistence in web applications.
