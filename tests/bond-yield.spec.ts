import { test } from "@playwright/test";
import { TEST_RESULT_PATH } from "../define";

test('US 10-Year Bond Yield', async ({ page }) => {
  // Set viewport size before navigation
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  // Navigate to the bond yield page
  await page.goto('https://ko.tradingeconomics.com/united-states/government-bond-yield', { 
    // waitUntil: 'networkidle' 
  });
  
  // Click on the 5Y tab and wait for chart to update
  await page.getByText('5Y', { exact: true }).click();
  
  // Wait for chart animation to complete
  await page.waitForTimeout(1000);
  
  // Take screenshot of the chart
  await page.locator('.highcharts-background').screenshot({ 
    path: `${TEST_RESULT_PATH}/US_10Y.png` 
  });
});