/**
 * PROJ-13: E2E tests for auth redirect behaviour
 *
 * Tests:
 * - Visiting / unauthenticated redirects to /login
 * - Visiting /login while authenticated redirects to /
 *
 * These tests do NOT require E2E_SUPABASE_URL for the unauthenticated
 * redirect check (the middleware handles it server-side with no DB call).
 * Tests requiring authentication are gated.
 */
import { test, expect } from '@playwright/test'

const E2E_ENABLED = !!process.env.E2E_SUPABASE_URL

test.describe('Auth redirect', () => {
  test('visiting / without authentication redirects to /login', async ({ page }) => {
    // No cookies set → unauthenticated
    await page.goto('/')

    // Middleware should redirect to /login
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
    await expect(page.getByTestId('login-form')).toBeVisible()
  })

  test('visiting /signup directly is accessible unauthenticated', async ({ page }) => {
    await page.goto('/signup')
    await expect(page).toHaveURL(/\/signup/)
    await expect(page.getByTestId('signup-form')).toBeVisible()
  })

  test('visiting /login directly is accessible unauthenticated', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByTestId('login-form')).toBeVisible()
  })

  test('authenticated user visiting / sees the dashboard', async ({ page }) => {
    test.skip(!E2E_ENABLED, 'Skipped: E2E_SUPABASE_URL not set')

    const email = process.env.E2E_TEST_USER_EMAIL || 'e2e_user@example.com'
    const password = process.env.E2E_TEST_USER_PASSWORD || 'TestPassword123!'

    // Sign in
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/password/i).fill(password)
    await page.getByTestId('login-submit').click()
    await page.waitForURL('/', { timeout: 10_000 })

    // Should stay on /
    await expect(page).toHaveURL('/')
    await expect(page.getByTestId('monthly-total')).toBeVisible()
  })

  test('session cookie persists across page reload', async ({ page }) => {
    test.skip(!E2E_ENABLED, 'Skipped: E2E_SUPABASE_URL not set')

    const email = process.env.E2E_TEST_USER_EMAIL || 'e2e_user@example.com'
    const password = process.env.E2E_TEST_USER_PASSWORD || 'TestPassword123!'

    await page.goto('/login')
    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/password/i).fill(password)
    await page.getByTestId('login-submit').click()
    await page.waitForURL('/', { timeout: 10_000 })

    // Reload the page
    await page.reload()

    // Should still be on / (session cookie is valid)
    await expect(page).toHaveURL('/')
    await expect(page.getByTestId('monthly-total')).toBeVisible()
  })
})
