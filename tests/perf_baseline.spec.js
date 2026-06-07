
import { test, expect } from '@playwright/test';

test('measure network requests during typing', async ({ page }) => {
  let requestCount = 0;
  await page.route('**/api/**/history', route => {
    requestCount++;
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
  });

  await page.goto('http://localhost:3000');

  // Create a blank cheatsheet
  await page.click('#blank-btn');

  // Find the first section and type
  const editor = page.locator('.section-content').first();
  await editor.focus();
  const text = 'Testing performance';
  for (const char of text) {
    await page.keyboard.type(char);
    // await page.waitForTimeout(50); // Simulate human typing speed
  }

  console.log(`Total history API requests for ${text.length} characters: ${requestCount}`);

  // We expect it to be much less than text.length * 2 (since there are 2 requests per save)
  // Currently it's likely text.length * 2.
});
