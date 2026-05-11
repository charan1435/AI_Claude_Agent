/**
 * PROJ-12: Component tests for SignupForm
 *
 * Tests:
 * - Confirm-password mismatch shows inline error and does NOT call signUp
 * - Valid form calls signUp
 * - "check your email" confirmation renders when no session returned
 * - Session present → push('/')
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

const mockSignUp = jest.fn()

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signUp: mockSignUp,
    },
  }),
}))

jest.mock('next/link', () => {
  const Link = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
  Link.displayName = 'Link'
  return Link
})

// ---------------------------------------------------------------------------
// Import component AFTER mocks
// ---------------------------------------------------------------------------
import { SignupForm } from '@/components/auth/SignupForm'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setup() {
  const user = userEvent.setup()
  render(<SignupForm />)
  return { user }
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^email/i), 'new@example.com')
  await user.type(screen.getByLabelText(/^password/i), 'securePass1')
  await user.type(screen.getByLabelText(/confirm password/i), 'securePass1')
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  mockPush.mockReset()
  mockRefresh.mockReset()
  mockSignUp.mockReset()
})

describe('SignupForm', () => {
  it('renders email, password, and confirm-password fields', () => {
    setup()
    expect(screen.getByLabelText(/^email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
  })

  it('renders the create account submit button', () => {
    setup()
    expect(screen.getByTestId('signup-submit')).toBeInTheDocument()
  })

  it('renders the signup form with correct testid', () => {
    setup()
    expect(screen.getByTestId('signup-form')).toBeInTheDocument()
  })

  it('shows inline error and does NOT call signUp when passwords do not match', async () => {
    const { user } = setup()

    await user.type(screen.getByLabelText(/^email/i), 'user@example.com')
    await user.type(screen.getByLabelText(/^password/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'differentpassword')
    await user.click(screen.getByTestId('signup-submit'))

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    })
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('calls signUp with email and password when form is valid', async () => {
    mockSignUp.mockResolvedValue({ data: { session: null }, error: null })
    const { user } = setup()

    await fillValidForm(user)
    await user.click(screen.getByTestId('signup-submit'))

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledTimes(1)
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'securePass1',
      })
    })
  })

  it('shows confirmation message when signUp returns no session (email confirmation required)', async () => {
    mockSignUp.mockResolvedValue({ data: { session: null }, error: null })
    const { user } = setup()

    await fillValidForm(user)
    await user.click(screen.getByTestId('signup-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('signup-confirmation')).toBeInTheDocument()
      expect(screen.getByText(/check your email/i)).toBeInTheDocument()
    })
  })

  it('calls router.push("/") when signUp returns a session', async () => {
    mockSignUp.mockResolvedValue({
      data: { session: { access_token: 'token123' } },
      error: null,
    })
    const { user } = setup()

    await fillValidForm(user)
    await user.click(screen.getByTestId('signup-submit'))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })

  it('shows server error when signUp returns an error', async () => {
    mockSignUp.mockResolvedValue({
      data: { session: null },
      error: { message: 'User already registered' },
    })
    const { user } = setup()

    await fillValidForm(user)
    await user.click(screen.getByTestId('signup-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('signup-error')).toBeInTheDocument()
      expect(screen.getByText(/user already registered/i)).toBeInTheDocument()
    })
  })

  it('does NOT show confirmation or push when signUp fails', async () => {
    mockSignUp.mockResolvedValue({
      data: { session: null },
      error: { message: 'Something went wrong' },
    })
    const { user } = setup()

    await fillValidForm(user)
    await user.click(screen.getByTestId('signup-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('signup-error')).toBeInTheDocument()
    })
    expect(mockPush).not.toHaveBeenCalled()
    expect(screen.queryByTestId('signup-confirmation')).not.toBeInTheDocument()
  })

  it('shows required error when email is empty on submit', async () => {
    const { user } = setup()
    await user.click(screen.getByTestId('signup-submit'))

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    })
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('shows min-length error for short password', async () => {
    const { user } = setup()

    await user.type(screen.getByLabelText(/^email/i), 'u@e.com')
    await user.type(screen.getByLabelText(/^password/i), 'short')
    await user.type(screen.getByLabelText(/confirm password/i), 'short')
    await user.click(screen.getByTestId('signup-submit'))

    await waitFor(() => {
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument()
    })
    expect(mockSignUp).not.toHaveBeenCalled()
  })
})
