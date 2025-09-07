import { chromium, Browser, Page } from 'playwright';
import { TEST_RESULT_PATH } from '../define';
import { describe, expect } from '@jest/globals';

describe('CNN Fear and Greed Index', () => {
  let browser: Browser;
  let page: Page;
  
  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
  });
  
  afterAll(async () => {
    await browser.close();
  });
  
  beforeEach(async () => {
    page = await browser.newPage();
  });
  
  afterEach(async () => {
    await page.close();
  });
  
  it('should capture screenshot of Fear and Greed Index', async () => {
    
    try {
      await page.goto("https://edition.cnn.com/markets/fear-and-greed", { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      
      await page.waitForTimeout(2000);
      
      // Make sure the element exists before taking a screenshot
      const container = await page.locator(".market-tabbed-container");
      expect(await container.count()).toBeGreaterThan(0);
      
      await container.screenshot({ 
        path: `${TEST_RESULT_PATH}/fear-and-greed.png` 
      });
      
    } catch (error) {
      console.error('Error capturing Fear and Greed Index:', error);
      throw error;
    }
  }, 60000); // 60 second timeout for this test
});
