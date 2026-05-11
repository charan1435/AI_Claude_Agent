/**
 * PROJ-12: Component tests for ExpenseFilter
 *
 * Tests:
 * - Pill click updates URL with ?category=
 * - "All" pill clears the ?category= param
 * - Active pill state matches current URL
 */
import * as React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPush = jest.fn()
let mockParams = new URLSearchParams()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: jest.fn(),
  }),
  useSearchParams: () => mockParams,
  usePathname: () => '/',
}))

// ---------------------------------------------------------------------------
// Import AFTER mocks
// ---------------------------------------------------------------------------
import { ExpenseFilter } from '@/components/expenses/ExpenseFilter'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setup(initialParams: Record<string, string> = {}) {
  mockParams = new URLSearchParams(initialParams)
  const user = userEvent.setup()
  render(<ExpenseFilter />)
  return { user }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  mockPush.mockReset()
  mockParams = new URLSearchParams()
})

describe('ExpenseFilter', () => {
  it('renders all category filter pills including "all"', () => {
    setup()
    expect(screen.getByTestId('filter-all')).toBeInTheDocument()
    expect(screen.getByTestId('filter-Food')).toBeInTheDocument()
    expect(screen.getByTestId('filter-Transport')).toBeInTheDocument()
    expect(screen.getByTestId('filter-Bills')).toBeInTheDocument()
    expect(screen.getByTestId('filter-Other')).toBeInTheDocument()
  })

  it('renders the filter container with correct testid', () => {
    setup()
    expect(screen.getByTestId('expense-filter')).toBeInTheDocument()
  })

  it('"all" pill is active by default when no category param', () => {
    setup()
    const allPill = screen.getByTestId('filter-all')
    expect(allPill).toHaveAttribute('aria-checked', 'true')
  })

  it('active category pill matches the URL ?category= param', () => {
    setup({ category: 'Food' })
    expect(screen.getByTestId('filter-Food')).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByTestId('filter-all')).toHaveAttribute('aria-checked', 'false')
  })

  it('clicking a category pill calls router.push with ?category=', async () => {
    const { user } = setup()

    await user.click(screen.getByTestId('filter-Food'))

    expect(mockPush).toHaveBeenCalledTimes(1)
    const calledUrl: string = mockPush.mock.calls[0][0]
    expect(calledUrl).toContain('category=Food')
  })

  it('clicking Transport pill updates URL to ?category=Transport', async () => {
    const { user } = setup()

    await user.click(screen.getByTestId('filter-Transport'))

    const calledUrl: string = mockPush.mock.calls[0][0]
    expect(calledUrl).toContain('category=Transport')
  })

  it('clicking Bills pill updates URL to ?category=Bills', async () => {
    const { user } = setup()

    await user.click(screen.getByTestId('filter-Bills'))

    const calledUrl: string = mockPush.mock.calls[0][0]
    expect(calledUrl).toContain('category=Bills')
  })

  it('clicking Other pill updates URL to ?category=Other', async () => {
    const { user } = setup()

    await user.click(screen.getByTestId('filter-Other'))

    const calledUrl: string = mockPush.mock.calls[0][0]
    expect(calledUrl).toContain('category=Other')
  })

  it('clicking "all" pill removes the ?category= param from the URL', async () => {
    const { user } = setup({ category: 'Bills' })

    await user.click(screen.getByTestId('filter-all'))

    expect(mockPush).toHaveBeenCalledTimes(1)
    const calledUrl: string = mockPush.mock.calls[0][0]
    expect(calledUrl).not.toContain('category=')
  })

  it('preserves existing query params when setting a category filter', async () => {
    const { user } = setup({ q: 'coffee' })

    await user.click(screen.getByTestId('filter-Food'))

    const calledUrl: string = mockPush.mock.calls[0][0]
    expect(calledUrl).toContain('category=Food')
    expect(calledUrl).toContain('q=coffee')
  })

  it('preserves existing query params when clearing the category filter', async () => {
    const { user } = setup({ category: 'Food', q: 'lunch' })

    await user.click(screen.getByTestId('filter-all'))

    const calledUrl: string = mockPush.mock.calls[0][0]
    expect(calledUrl).not.toContain('category=')
    expect(calledUrl).toContain('q=lunch')
  })

  it('renders pills with role="radio"', () => {
    setup()
    const radios = screen.getAllByRole('radio')
    // 5 pills: all, Food, Transport, Bills, Other
    expect(radios).toHaveLength(5)
  })
})
