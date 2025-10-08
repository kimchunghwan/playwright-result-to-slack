import { test, expect } from '@playwright/test';
import { TEST_RESULT_PATH } from '../define';

test.describe('CNN Fear and Greed Index', () => {
  test('should capture screenshot of Fear and Greed Index', async ({ page }) => {
    try {
      // Navigate to CNN Fear and Greed page
      await page.goto("https://edition.cnn.com/markets/fear-and-greed", { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      
      // Wait for content to load
      await page.waitForTimeout(2000);
      
      // Make sure the element exists before taking a screenshot
      const container = page.locator(".market-tabbed-container");
      await expect(container).toBeVisible();
      
      // Take screenshot
      await container.screenshot({ 
        path: `${TEST_RESULT_PATH}/fear-and-greed.png` 
      });
      
    } catch (error) {
      console.error('Error capturing Fear and Greed Index:', error);
      throw error;
    }
  });
});
