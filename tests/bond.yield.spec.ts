import { test, expect } from "@playwright/test";
import { testResultPath } from "./stock.spec";

test('test', async ({ page }) => {
  await page.goto('https://ko.tradingeconomics.com/united-states/government-bond-yield');
  await page.getByText('5Y', { exact: true }).click();
  page.locator('.highcharts-background').screenshot({ path: `./${testResultPath}/US_10Y.png` });
});