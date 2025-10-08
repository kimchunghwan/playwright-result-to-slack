import { Page, test } from "@playwright/test";
import { FINVIZ_SYMBOLS, finvizURL, TEST_RESULT_PATH, URLS } from "../define";

/**
 * Helper function to capture a chart screenshot with proper error handling
 */
const captureChart = async (page: Page, url: string, selector: string, fileName: string) => {
  // Set viewport size for consistent screenshots
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  try {
    // Navigate with proper error handling and wait options
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
      .catch(error => {
        console.error(`Navigation error for ${url}: ${error.message}`);
      });
    
    // Allow time for any dynamic content to load
    await page.waitForTimeout(2000);
    
    // Take screenshot with proper error handling
    await page.locator(selector).screenshot({ 
      path: `${TEST_RESULT_PATH}/${fileName}`,
      timeout: 5000 
    }).catch(error => {
      console.error(`Screenshot error for ${fileName}: ${error.message}`);
    });
  } catch (error) {
    console.error(`Failed to capture ${fileName}: ${error}`);
  }
};

// Korean market indices test
test("Korean Market Indices (KOSPI, KOSDAQ)", async ({ page }) => {
  // Capture KOSPI monthly chart
  await captureChart(
    page, 
    URLS.KOSPI,
    ".ciq-chart-area",
    "KOSPI_monthly.png"
  );
  
  // Click on monthly view
  await page.getByText("월", { exact: true }).click();
  await page.waitForTimeout(1000);
  
  // Re-take the screenshot after switching to monthly view
  await page.locator(".ciq-chart-area").screenshot({ 
    path: `${TEST_RESULT_PATH}/KOSPI_monthly.png` 
  });

  // Capture KOSDAQ monthly chart
  await captureChart(
    page,
    URLS.KOSDAQ,
    ".ciq-chart-area",
    "KOSDAQ_monthly.png"
  );
  
  // Click on monthly view
  await page.getByText("월", { exact: true }).click();
  await page.waitForTimeout(1000);
  
  // Re-take the screenshot after switching to monthly view
  await page.locator(".ciq-chart-area").screenshot({ 
    path: `${TEST_RESULT_PATH}/KOSDAQ_monthly.png` 
  });
});

// Finviz homepage test
test("Finviz Homepage", async ({ page }) => {
  await captureChart(
    page,
    URLS.FINVIZ_HOME,
    ".fv-container",
    "finviz-home.png"
  );
});

// Stock symbol charts tests
test.describe("Finviz Stock Charts", () => {
  for (const symbol of FINVIZ_SYMBOLS) {
    test(`${symbol} Chart`, async ({ page }) => {
      await captureChart(
        page,
        finvizURL(symbol),
        "#chart",
        `finviz-${symbol}.png`
      );
    });
  }
});
