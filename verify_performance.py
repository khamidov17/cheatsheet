import asyncio
from playwright.async_api import async_playwright
import time

async def run_verification():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        history_requests = []

        async def handle_request(request):
            if "/history" in request.url and request.method == "POST":
                history_requests.append(request.url)

        page.on("request", handle_request)

        # 1. Load the page
        print("Loading application...")
        await page.goto("http://localhost:3000")
        await page.wait_for_selector("#blank-btn")

        # 2. Create a blank cheatsheet (Immediate save expected)
        print("Creating blank cheatsheet...")
        await page.click("#blank-btn")
        await page.wait_for_selector(".section-content")

        # Give it a moment to complete the immediate save from creation
        await asyncio.sleep(1)
        initial_request_count = len(history_requests)
        print(f"Initial requests after creation: {initial_request_count}")

        # 3. Type 10 characters rapidly
        print("Typing 10 characters rapidly...")
        section = page.locator(".section-content").first
        await section.focus()
        for i in range(10):
            await page.keyboard.type(f" {i}")
            # No sleep here to simulate rapid typing

        # 4. Wait for a moment to see if more requests are made
        # Debounce is 1000ms, so let's wait 2 seconds
        print("Waiting for debounce...")
        await asyncio.sleep(2)

        final_request_count = len(history_requests)
        new_requests = final_request_count - initial_request_count

        print(f"Total requests after typing: {final_request_count}")
        print(f"New requests triggered by typing: {new_requests}")

        # 5. Verify optimization
        # Previously, 10 characters might trigger 10 requests (or at least many).
        # Now it should be 1 (the debounced one).
        if new_requests <= 2:
            print("✅ SUCCESS: Performance optimization verified. Requests are debounced.")
        else:
            print(f"❌ FAILURE: Too many requests ({new_requests}). Optimization may not be working.")

        await page.screenshot(path="performance_verification.png")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(run_verification())
