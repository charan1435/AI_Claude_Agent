import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for Personal Expense Tracker — MVP.
 * Single Chromium project. Spins up `npm run dev` as the web server.
 *
 * To run: npx playwright test
 * To install browsers: npx playwright install
 *
 * E2E tests that require a real Supabase instance are gated behind
 * the E2E_SUPABASE_URL env variable. When the variable is absent,
 * those tests are skipped via test.skip() at the top of each spec.
 */
export default defineConfig({
  testDir: './e2e',

  // Global timeout per test
  timeout: 30_000,

  // Fail fast in CI
  forbidOnly: !!process.env.CI,

  // Retry on flake in CI
  retries: process.env.CI ? 2 : 0,

  // Run tests in parallel
  workers: process.env.CI ? 1 : undefined,

  // Reporter
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: 'http://localhost:3000',

    // Collect trace on retry
    trace: 'on-first-retry',

    // Screenshots on failure
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Start the dev server before running tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
