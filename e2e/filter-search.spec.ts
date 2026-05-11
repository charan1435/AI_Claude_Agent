/**
 * PROJ-13: E2E tests for filter + search
 *
 * Tests:
 * - Create three expenses across categories with distinct notes
 * - Filter by category → assert URL and visible rows
 * - Search by note text → assert URL and visible rows
 * - Combined filter + search
 *
 * Gated behind E2E_SUPABASE_URL.
 */
import { test, expect, Page } from '@playwright/test'

const E2E_ENABLED = !!process.env.E2E_SUPABASE_URL

const TEST_USER_EMAIL =
  process.env.E2E_TEST_USER_EMAIL || 'e2e_filter_user@example.com'
const TEST_USER_PASSWORD = process.env.E2E_TEST_USER_PASSWORD || 'TestPassword123!'

async function signIn(page: Page) {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(TEST_USER_EMAIL)
  await page.getByLabel(/password/i).fill(TEST_USER_PASSWORD)
  await page.getByTestId('login-submit').click()
  await page.waitForURL('/', { timeout: 10_000 })
}

async function createExpense(
  page: Page,
  opts: { amount: string; category: string; note: string }
) {
  await page.getByTestId('add-expense-button').click()
  await expect(page.getByTestId('expense-form-dialog')).toBeVisible({ timeout: 5_000 })

  await page.getByTestId('amount-input').fill(opts.amount)
  await page.getByTestId(`category-${opts.category.toLowerCase()}`).click()
  await page.getByTestId('note-input').fill(opts.note)
  await page.getByTestId('form-submit').click()
  await expect(page.getByTestId('expense-form-dialog')).not.toBeVisible({ timeout: 5_000 })
}

test.describe('Filter and search flow', () => {
  test.skip(!E2E_ENABLED, 'Skipped: E2E_SUPABASE_URL not set')

  test.beforeEach(async ({ page }) => {
    await signIn(page)

    // Create three test expenses with distinct categories and notes
    await createExpense(page, { amount: '10', category: 'food', note: 'FilterTest salad bowl' })
    await createExpense(page, { amount: '20', category: 'transport', note: 'FilterTest uber home' })
    await createExpense(page, { amount: '30', category: 'bills', note: 'FilterTest electricity' })
  })

  test('filtering by Food category shows only Food expenses and updates URL', async ({ page }) => {
    await page.getByTestId('filter-Food').click()

    // URL should contain category=Food
    await expect(page).toHaveURL(/category=Food/)

    // Only the Food expense note should be visible
    await expect(page.getByText('FilterTest salad bowl')).toBeVisible()
    await expect(page.getByText('FilterTest uber home')).not.toBeVisible()
    await expect(page.getByText('FilterTest electricity')).not.toBeVisible()
  })

  test('filtering by Transport shows only Transport expenses', async ({ page }) => {
    await page.getByTestId('filter-Transport').click()

    await expect(page).toHaveURL(/category=Transport/)
    await expect(page.getByText('FilterTest uber home')).toBeVisible()
    await expect(page.getByText('FilterTest salad bowl')).not.toBeVisible()
  })

  test('filtering by Bills shows only Bills expenses', async ({ page }) => {
    await page.getByTestId('filter-Bills').click()

    await expect(page).toHaveURL(/category=Bills/)
    await expect(page.getByText('FilterTest electricity')).toBeVisible()
    await expect(page.getByText('FilterTest salad bowl')).not.toBeVisible()
  })

  test('clearing filter with "all" shows all expenses and removes category from URL', async ({
    page,
  }) => {
    // First filter
    await page.getByTestId('filter-Food').click()
    await expect(page).toHaveURL(/category=Food/)

    // Then clear
    await page.getByTestId('filter-all').click()
    await expect(page).not.toHaveURL(/category=/)

    // All three test expenses visible
    await expect(page.getByText('FilterTest salad bowl')).toBeVisible()
    await expect(page.getByText('FilterTest uber home')).toBeVisible()
    await expect(page.getByText('FilterTest electricity')).toBeVisible()
  })

  test('searching by note text filters the list and updates URL with ?q=', async ({ page }) => {
    const searchInput = page.getByTestId('search-input')
    await searchInput.fill('salad')

    // Wait for debounce (250ms + network)
    await page.waitForTimeout(500)

    // URL should contain q=salad
    await expect(page).toHaveURL(/q=salad/)

    // Only the matching expense should be visible
    await expect(page.getByText('FilterTest salad bowl')).toBeVisible()
    await expect(page.getByText('FilterTest uber home')).not.toBeVisible()
    await expect(page.getByText('FilterTest electricity')).not.toBeVisible()
  })

  test('searching by partial note text works (ILIKE match)', async ({ page }) => {
    await page.getByTestId('search-input').fill('FilterTest')
    await page.waitForTimeout(500)

    await expect(page).toHaveURL(/q=FilterTest/)

    // All three expenses match the common prefix
    await expect(page.getByText('FilterTest salad bowl')).toBeVisible()
    await expect(page.getByText('FilterTest uber home')).toBeVisible()
    await expect(page.getByText('FilterTest electricity')).toBeVisible()
  })

  test('clearing search removes ?q= from URL and shows all expenses', async ({ page }) => {
    await page.getByTestId('search-input').fill('electricity')
    await page.waitForTimeout(500)
    await expect(page).toHaveURL(/q=electricity/)

    // Clear the search
    await page.getByTestId('search-input').clear()
    await page.waitForTimeout(500)

    await expect(page).not.toHaveURL(/q=/)
  })

  test('category filter and search compose together', async ({ page }) => {
    // Filter by Food AND search for "salad"
    await page.getByTestId('filter-Food').click()
    await expect(page).toHaveURL(/category=Food/)

    await page.getByTestId('search-input').fill('salad')
    await page.waitForTimeout(500)

    await expect(page).toHaveURL(/category=Food/)
    await expect(page).toHaveURL(/q=salad/)

    await expect(page.getByText('FilterTest salad bowl')).toBeVisible()
    await expect(page.getByText('FilterTest uber home')).not.toBeVisible()
  })
})
