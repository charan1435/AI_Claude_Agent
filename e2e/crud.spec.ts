/**
 * PROJ-13: E2E tests for CRUD flow
 *
 * Tests:
 * - Create one expense via modal, assert it appears in list and monthly total updates
 * - Edit expense, assert update reflected
 * - Delete expense via confirm dialog, assert removal and total recalculation
 *
 * Gated behind E2E_SUPABASE_URL.
 */
import { test, expect, Page } from '@playwright/test'

const E2E_ENABLED = !!process.env.E2E_SUPABASE_URL

const TEST_USER_EMAIL = process.env.E2E_TEST_USER_EMAIL || 'e2e_crud_user@example.com'
const TEST_USER_PASSWORD = process.env.E2E_TEST_USER_PASSWORD || 'TestPassword123!'

/** Sign in and navigate to the dashboard. */
async function signIn(page: Page) {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(TEST_USER_EMAIL)
  await page.getByLabel(/password/i).fill(TEST_USER_PASSWORD)
  await page.getByTestId('login-submit').click()
  await page.waitForURL('/', { timeout: 10_000 })
}

/** Open the Add Expense dialog. */
async function openAddExpenseDialog(page: Page) {
  await page.getByTestId('add-expense-button').click()
  await expect(page.getByTestId('expense-form-dialog')).toBeVisible({ timeout: 5_000 })
}

/** Fill and submit the expense form. */
async function fillExpenseForm(
  page: Page,
  opts: {
    amount: string
    category?: 'food' | 'transport' | 'bills' | 'other'
    note?: string
    date?: string
  }
) {
  await page.getByTestId('amount-input').fill(opts.amount)

  if (opts.category) {
    await page.getByTestId(`category-${opts.category}`).click()
  }

  if (opts.date) {
    await page.getByTestId('date-input').fill(opts.date)
  }

  if (opts.note) {
    await page.getByTestId('note-input').fill(opts.note)
  }
}

test.describe('Expense CRUD flow', () => {
  test.skip(!E2E_ENABLED, 'Skipped: E2E_SUPABASE_URL not set')

  test.beforeEach(async ({ page }) => {
    await signIn(page)
  })

  test('creates an expense and it appears in the list', async ({ page }) => {
    await openAddExpenseDialog(page)
    await fillExpenseForm(page, {
      amount: '25.50',
      category: 'food',
      note: 'E2E test meal',
    })

    await page.getByTestId('form-submit').click()

    // Dialog should close
    await expect(page.getByTestId('expense-form-dialog')).not.toBeVisible({ timeout: 5_000 })

    // Expense should appear in the list
    await expect(page.getByTestId('expense-list')).toBeVisible()
    await expect(page.getByText('E2E test meal')).toBeVisible({ timeout: 5_000 })
  })

  test('monthly total updates after creating an expense', async ({ page }) => {
    // Get the total before adding
    const totalBefore = await page.getByTestId('monthly-total').textContent()

    await openAddExpenseDialog(page)
    await fillExpenseForm(page, { amount: '10.00', category: 'other', note: 'E2E total test' })
    await page.getByTestId('form-submit').click()

    await expect(page.getByTestId('expense-form-dialog')).not.toBeVisible({ timeout: 5_000 })

    // Total should have changed
    await page.waitForTimeout(1_000) // Allow server rerender
    const totalAfter = await page.getByTestId('monthly-total').textContent()
    expect(totalAfter).not.toBe(totalBefore)
  })

  test('edits an expense and the update is reflected in the list', async ({ page }) => {
    // First create an expense
    await openAddExpenseDialog(page)
    await fillExpenseForm(page, { amount: '15.00', category: 'transport', note: 'E2E edit target' })
    await page.getByTestId('form-submit').click()
    await expect(page.getByTestId('expense-form-dialog')).not.toBeVisible({ timeout: 5_000 })

    // Find the newly created row and open edit
    const editTargetRow = page.locator('[data-testid="expense-row"]').filter({ hasText: 'E2E edit target' }).first()
    await expect(editTargetRow).toBeVisible({ timeout: 5_000 })

    // Open the overflow menu
    await editTargetRow.getByTestId('expense-row-menu').click()
    await page.getByTestId('expense-edit').click()

    // Edit dialog opens
    await expect(page.getByTestId('expense-form-dialog')).toBeVisible({ timeout: 5_000 })

    // Change the note
    await page.getByTestId('note-input').clear()
    await page.getByTestId('note-input').fill('E2E updated note')
    await page.getByTestId('form-submit').click()

    await expect(page.getByTestId('expense-form-dialog')).not.toBeVisible({ timeout: 5_000 })

    // Updated note should appear
    await expect(page.getByText('E2E updated note')).toBeVisible({ timeout: 5_000 })
  })

  test('deletes an expense via confirm dialog and it disappears from list', async ({ page }) => {
    // Create the expense to be deleted
    await openAddExpenseDialog(page)
    await fillExpenseForm(page, { amount: '7.00', category: 'bills', note: 'E2E delete target' })
    await page.getByTestId('form-submit').click()
    await expect(page.getByTestId('expense-form-dialog')).not.toBeVisible({ timeout: 5_000 })

    // Find the row and open delete
    const deleteTargetRow = page.locator('[data-testid="expense-row"]').filter({ hasText: 'E2E delete target' }).first()
    await expect(deleteTargetRow).toBeVisible({ timeout: 5_000 })

    await deleteTargetRow.getByTestId('expense-row-menu').click()
    await page.getByTestId('expense-delete').click()

    // Confirm dialog appears
    await expect(page.getByTestId('delete-expense-dialog')).toBeVisible({ timeout: 5_000 })
    await page.getByTestId('delete-confirm').click()

    // Dialog closes and expense is gone
    await expect(page.getByTestId('delete-expense-dialog')).not.toBeVisible({ timeout: 5_000 })
    await expect(page.getByText('E2E delete target')).not.toBeVisible({ timeout: 5_000 })
  })

  test('monthly total recalculates after deleting an expense', async ({ page }) => {
    // Create a large expense so the change is detectable
    await openAddExpenseDialog(page)
    await fillExpenseForm(page, { amount: '500.00', category: 'bills', note: 'E2E total recalc' })
    await page.getByTestId('form-submit').click()
    await expect(page.getByTestId('expense-form-dialog')).not.toBeVisible({ timeout: 5_000 })

    const totalBefore = await page.getByTestId('monthly-total').textContent()

    // Delete it
    const row = page.locator('[data-testid="expense-row"]').filter({ hasText: 'E2E total recalc' }).first()
    await expect(row).toBeVisible({ timeout: 5_000 })
    await row.getByTestId('expense-row-menu').click()
    await page.getByTestId('expense-delete').click()
    await page.getByTestId('delete-confirm').click()
    await expect(page.getByTestId('delete-expense-dialog')).not.toBeVisible({ timeout: 5_000 })

    await page.waitForTimeout(1_000)
    const totalAfter = await page.getByTestId('monthly-total').textContent()
    expect(totalAfter).not.toBe(totalBefore)
  })

  test('cancelling the delete dialog leaves the expense in the list', async ({ page }) => {
    // Create an expense
    await openAddExpenseDialog(page)
    await fillExpenseForm(page, { amount: '8.00', category: 'food', note: 'E2E cancel delete' })
    await page.getByTestId('form-submit').click()
    await expect(page.getByTestId('expense-form-dialog')).not.toBeVisible({ timeout: 5_000 })

    // Open delete
    const row = page.locator('[data-testid="expense-row"]').filter({ hasText: 'E2E cancel delete' }).first()
    await expect(row).toBeVisible({ timeout: 5_000 })
    await row.getByTestId('expense-row-menu').click()
    await page.getByTestId('expense-delete').click()

    await expect(page.getByTestId('delete-expense-dialog')).toBeVisible()

    // Cancel
    await page.getByText(/cancel/i).click()

    // Expense still in list
    await expect(page.getByText('E2E cancel delete')).toBeVisible()
  })
})
