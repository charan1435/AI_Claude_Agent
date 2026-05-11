/**
 * PROJ-12: Component tests for ExpenseSearch
 *
 * Tests:
 * - Debounced 250ms before updating URL with ?q=
 * - Rapid typing does not push intermediate states
 * - Clears ?q= when input is cleared
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

jest.mock('lucide-react', () => ({
  SearchIcon: () => <span aria-hidden="true">S</span>,
}))

// ---------------------------------------------------------------------------
// Import AFTER mocks
// ---------------------------------------------------------------------------
import { ExpenseSearch } from '@/components/expenses/ExpenseSearch'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setup(initialParams: Record<string, string> = {}) {
  mockParams = new URLSearchParams(initialParams)
  const user = userEvent.setup({ delay: null }) // delay:null disables userEvent throttle
  render(<ExpenseSearch />)
  return { user }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  mockPush.mockReset()
  mockParams = new URLSearchParams()
  jest.useFakeTimers()
})

afterEach(() => {
  jest.runAllTimers()
  jest.useRealTimers()
})

describe('ExpenseSearch', () => {
  it('renders the search container with correct testid', () => {
    setup()
    expect(screen.getByTestId('expense-search')).toBeInTheDocument()
  })

  it('renders the search input with correct testid', () => {
    setup()
    expect(screen.getByTestId('search-input')).toBeInTheDocument()
  })

  it('renders the search input with correct placeholder', () => {
    setup()
    expect(screen.getByPlaceholderText(/search notes/i)).toBeInTheDocument()
  })

  it('initializes the input value from the ?q= URL param', () => {
    setup({ q: 'coffee' })
    const input = screen.getByTestId('search-input') as HTMLInputElement
    expect(input.value).toBe('coffee')
  })

  it('shows empty input when no ?q= param is present', () => {
    setup()
    const input = screen.getByTestId('search-input') as HTMLInputElement
    expect(input.value).toBe('')
  })

  it('does NOT call router.push immediately when typing (debounced)', async () => {
    const { user } = setup()

    await user.type(screen.getByTestId('search-input'), 'lu')
    // Timer has not fired yet
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('calls router.push with ?q= after 250ms debounce', async () => {
    const { user } = setup()

    await user.type(screen.getByTestId('search-input'), 'lunch')
    expect(mockPush).not.toHaveBeenCalled()

    // Advance timers past the 250ms debounce
    jest.advanceTimersByTime(251)

    expect(mockPush).toHaveBeenCalledTimes(1)
    const calledUrl: string = mockPush.mock.calls[0][0]
    expect(calledUrl).toContain('q=lunch')
  })

  it('rapid typing only triggers one push (debounce resets on each keystroke)', async () => {
    const { user } = setup()
    const input = screen.getByTestId('search-input')

    // Type characters with less than 250ms between each
    await user.type(input, 'c')
    jest.advanceTimersByTime(100)
    await user.type(input, 'o')
    jest.advanceTimersByTime(100)
    await user.type(input, 'f')
    jest.advanceTimersByTime(100)
    await user.type(input, 'f')
    jest.advanceTimersByTime(100)
    await user.type(input, 'e')
    jest.advanceTimersByTime(100)
    await user.type(input, 'e')

    // Timer not yet triggered
    expect(mockPush).not.toHaveBeenCalled()

    // Now advance past the final 250ms
    jest.advanceTimersByTime(260)

    // Only one push with the final value
    expect(mockPush).toHaveBeenCalledTimes(1)
    const calledUrl: string = mockPush.mock.calls[0][0]
    expect(calledUrl).toContain('q=coffee')
  })

  it('removes ?q= from URL when input is cleared', async () => {
    const { user } = setup({ q: 'lunch' })

    // Clear the input (it was initialized with "lunch" from the URL param)
    await user.clear(screen.getByTestId('search-input'))
    jest.advanceTimersByTime(260)

    expect(mockPush).toHaveBeenCalledTimes(1)
    const calledUrl: string = mockPush.mock.calls[0][0]
    expect(calledUrl).not.toContain('q=')
  })

  it('trims whitespace from query before setting ?q=', async () => {
    const { user } = setup()

    await user.type(screen.getByTestId('search-input'), '  coffee  ')
    jest.advanceTimersByTime(260)

    expect(mockPush).toHaveBeenCalledTimes(1)
    const calledUrl: string = mockPush.mock.calls[0][0]
    expect(calledUrl).toContain('q=coffee')
    expect(calledUrl).not.toContain('q=++')
  })

  it('preserves existing URL params when setting ?q=', async () => {
    mockParams = new URLSearchParams({ category: 'Food' })
    const user = userEvent.setup({ delay: null })
    render(<ExpenseSearch />)

    await user.type(screen.getByTestId('search-input'), 'salad')
    jest.advanceTimersByTime(260)

    const calledUrl: string = mockPush.mock.calls[0][0]
    expect(calledUrl).toContain('q=salad')
    expect(calledUrl).toContain('category=Food')
  })
})
