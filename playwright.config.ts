import { defineConfig, devices } from "@playwright/test";
import { TEST_RESULT_PATH } from "./define";

// Load environment variables from .env file if it exists
// require('dotenv').config() can be used if dotenv package is installed

/**
 * See https://playwright.dev/docs/test-configuration for more options
 */
export default defineConfig({
  // Directory where tests are located
  testDir: "./tests",
  
  // Directory where test results will be stored
  outputDir: TEST_RESULT_PATH,
  
  // Maximum time one test can run (5 minutes)
  timeout: 300000,
  
  // Run tests in files in parallel for better performance
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry failed tests on CI for better stability
  retries: process.env.CI ? 2 : 1,
  
  // Limit parallel tests on CI to avoid resource issues
  workers: process.env.CI ? 1 : 3,
  
  // Use HTML reporter for nice visual test reports
  reporter: [
    ['html', { open: 'never' }],
    ['list', { printSteps: true }]
  ],
  
  // Global test setup
  use: {
    // Base viewport size for consistent screenshots
    viewport: { width: 1920, height: 1080 },
    
    // Enable screenshot on failure for debugging
    screenshot: 'only-on-failure',
    
    // Collect trace for failed tests for debugging
    trace: 'retain-on-failure',
    
    // Capture video for failed tests
    video: 'on-first-retry',
    
    // Set navigation timeout
    navigationTimeout: 30000,
    
    // Wait for network to be idle before considering navigation complete
    actionTimeout: 15000,
  },

  // Browser configurations
  projects: [
    {
      name: "chromium",
      use: { 
        ...devices["Desktop Chrome"],
        // Use headless browsers in CI, headed locally for debugging
        headless: !!process.env.CI,
      },
    },
    // Uncomment additional browser configurations as needed
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
  ],
});
