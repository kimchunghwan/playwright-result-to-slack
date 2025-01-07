import { test, expect } from "@playwright/test";

const ALPHA_SYMBOLS = ["TLT", "NVDA"];
async function captureSymbol(page, symbol) {
  await page.goto(
    `https://alphasquare.co.kr/home/special-factor?code=${symbol}&factor=returns_top`
  );
  await page
    .locator("div")
    .filter({ hasText: /^알파스퀘어 소개하고 수익금 적립받자!$/ })
    .getByRole("button")
    .click();
  await page
    .locator(".chart-nav-period-controller-favorite-period > .a-plain")
    .click();
  // await page
  //   .locator("div")
  //   .filter({ hasText: /^7일\(주\)$/ })
  //   .click();
  await page.getByRole("button", { name: "보조지표" }).click();
  await page.locator("div").filter({ hasText: /^RSI$/ }).click();
  await page
    .locator(".primechart__chart")
    .screenshot({ path: `./test-results/alpha_${symbol.toLowerCase()}.png` });
}
test("test", async ({ page }) => {
  // screen size
  await page.setViewportSize({ width: 1920, height: 1080 });
  for (const symbol of ALPHA_SYMBOLS) {
    await captureSymbol(page, symbol);
  }
});
