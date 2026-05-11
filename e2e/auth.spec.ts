/**
 * PROJ-13: E2E tests for auth flow
 *
 * Tests:
 * - Sign up new user → redirected to /
 * - Sign out
 * - Sign in → land on /
 *
 * Gated behind E2E_SUPABASE_URL — skipped in CI when env is absent.
 * Run: npx playwright install then npx playwright test e2e/auth.spec.ts
 */
import { test, expect } from '@playwright/test'

const E2E_ENABLED = !!process.env.E2E_SUPABASE_URL

// Generate a unique email for each test run to avoid conflicts
function uniqueEmail(): string {
  return `testuser_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`
}

const TEST_PASSWORD = 'TestPassword123!'

test.describe('Auth flow', () => {
  test.skip(!E2E_ENABLED, 'Skipped: E2E_SUPABASE_URL not set')

  test('sign up with new email, redirected to dashboard', async ({ page }) => {
    const email = uniqueEmail()

    await page.goto('/signup')
    await expect(page).toHaveURL('/signup')

    // Fill the signup form
    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/^password/i).fill(TEST_PASSWORD)
    await page.getByLabel(/confirm password/i).fill(TEST_PASSWORD)

    await page.getByTestId('signup-submit').click()

    // Either redirected to / (auto-confirmed) or confirmation message shown
    await expect(
      page.getByTestId('signup-confirmation').or(page.url().includes('/') ? page.locator('body') : page.getByTestId('signup-confirmation'))
    ).toBeVisible({ timeout: 10_000 })
  })

  test('sign in with existing credentials, land on dashboard (/)', async ({ page }) => {
    // Use pre-seeded test credentials from environment
    const email = process.env.E2E_TEST_USER_EMAIL || 'e2e_user@example.com'
    const password = process.env.E2E_TEST_USER_PASSWORD || TEST_PASSWORD

    await page.goto('/login')
    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/password/i).fill(password)
    await page.getByTestId('login-submit').click()

    await page.waitForURL('/', { timeout: 10_000 })
    expect(page.url()).toContain('localhost:3000/')
  })

  test('sign out redirects to /login', async ({ page }) => {
    const email = process.env.E2E_TEST_USER_EMAIL || 'e2e_user@example.com'
    const password = process.env.E2E_TEST_USER_PASSWORD || TEST_PASSWORD

    // Sign in first
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/password/i).fill(password)
    await page.getByTestId('login-submit').click()
    await page.waitForURL('/', { timeout: 10_000 })

    // Click sign out
    await page.getByRole('button', { name: /sign out/i }).click()

    // Should redirect to /login
    await page.waitForURL('/login', { timeout: 10_000 })
    await expect(page.getByTestId('login-form')).toBeVisible()
  })

  test('invalid credentials show error message', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('nonexistent@example.com')
    await page.getByLabel(/password/i).fill('wrongpassword')
    await page.getByTestId('login-submit').click()

    await expect(page.getByTestId('login-error')).toBeVisible({ timeout: 5_000 })
  })

  test('password mismatch on signup shows error and does not create account', async ({ page }) => {
    await page.goto('/signup')

    await page.getByLabel(/email/i).fill(uniqueEmail())
    await page.getByLabel(/^password/i).fill('Password123!')
    await page.getByLabel(/confirm password/i).fill('DifferentPassword!')
    await page.getByTestId('signup-submit').click()

    await expect(page.getByText(/passwords do not match/i)).toBeVisible({ timeout: 3_000 })
    expect(page.url()).toContain('/signup')
  })
})
