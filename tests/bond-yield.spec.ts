import { test, expect } from "@playwright/test";

const testResultPath = "test-results";
test('test', async ({ page }) => {

  await page.goto('https://ko.tradingeconomics.com/united-states/government-bond-yield');
  await page.setViewportSize({ width: 1920, height: 1920 });  
  await page.getByText('5Y', { exact: true }).click();
  await page.waitForTimeout(1000);
  await page.locator('.highcharts-background').screenshot({ path: `./${testResultPath}/US_10Y.png` });
});