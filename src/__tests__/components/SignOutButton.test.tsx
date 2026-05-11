/**
 * PROJ-12: Component tests for SignOutButton
 *
 * Tests:
 * - Renders the button
 * - Click calls POST /api/auth/signout
 * - After fetch, calls router.push('/login') and router.refresh()
 * - Handles fetch errors gracefully (still redirects)
 */
import * as React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPush = jest.fn()
const mockRefresh = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// ---------------------------------------------------------------------------
// Import AFTER mocks
// ---------------------------------------------------------------------------
import { SignOutButton } from '@/components/auth/SignOutButton'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  mockPush.mockReset()
  mockRefresh.mockReset()
  ;(global.fetch as jest.Mock | undefined) && (global.fetch as jest.Mock).mockReset?.()
})

describe('SignOutButton', () => {
  it('renders the sign out button', () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 204 }) as jest.Mock
    render(<SignOutButton />)
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })

  it('calls POST /api/auth/signout on click', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 204 }) as jest.Mock
    const user = userEvent.setup()
    render(<SignOutButton />)

    await user.click(screen.getByRole('button', { name: /sign out/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/signout', { method: 'POST' })
    })
  })

  it('redirects to /login after successful signout', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 204 }) as jest.Mock
    const user = userEvent.setup()
    render(<SignOutButton />)

    await user.click(screen.getByRole('button', { name: /sign out/i }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })

  it('calls router.refresh() after signout', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 204 }) as jest.Mock
    const user = userEvent.setup()
    render(<SignOutButton />)

    await user.click(screen.getByRole('button', { name: /sign out/i }))

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalledTimes(1)
    })
  })

  it('redirects to /login even when fetch throws (error handled gracefully)', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error')) as jest.Mock
    const user = userEvent.setup()
    render(<SignOutButton />)

    await user.click(screen.getByRole('button', { name: /sign out/i }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })
})
