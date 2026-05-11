/**
 * PROJ-12: Component tests for LoginForm
 *
 * Tests:
 * - Renders email + password fields
 * - Submit calls supabase.auth.signInWithPassword with entered values
 * - Error path shows oxblood inline error (data-testid="login-error")
 * - Success path triggers router.refresh() + push('/')
 */
import * as React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// ---------------------------------------------------------------------------
// Mocks (must be declared before importing the component under test)
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

const mockSignInWithPassword = jest.fn()

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
  }),
}))

// Mock next/link to avoid router context issues
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
import { LoginForm } from '@/components/auth/LoginForm'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setup() {
  const user = userEvent.setup()
  render(<LoginForm />)
  return { user }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  mockPush.mockReset()
  mockRefresh.mockReset()
  mockSignInWithPassword.mockReset()
})

describe('LoginForm', () => {
  it('renders email and password input fields', () => {
    setup()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('renders the sign in submit button', () => {
    setup()
    expect(screen.getByTestId('login-submit')).toBeInTheDocument()
    expect(screen.getByTestId('login-submit')).toHaveTextContent(/sign in/i)
  })

  it('renders the login form wrapper with correct testid', () => {
    setup()
    expect(screen.getByTestId('login-form')).toBeInTheDocument()
  })

  it('does not show the error message initially', () => {
    setup()
    expect(screen.queryByTestId('login-error')).not.toBeInTheDocument()
  })

  it('calls signInWithPassword with entered email and password on submit', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null })
    const { user } = setup()

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByTestId('login-submit'))

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledTimes(1)
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })

  it('calls router.refresh() and push("/") on successful sign-in', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null })
    const { user } = setup()

    await user.type(screen.getByLabelText(/email/i), 'user@example.com')
    await user.type(screen.getByLabelText(/password/i), 'mypassword')
    await user.click(screen.getByTestId('login-submit'))

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalledTimes(1)
      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })

  it('shows the inline error message when signInWithPassword returns an error', async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    })
    const { user } = setup()

    await user.type(screen.getByLabelText(/email/i), 'wrong@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
    await user.click(screen.getByTestId('login-submit'))

    await waitFor(() => {
      const errorEl = screen.getByTestId('login-error')
      expect(errorEl).toBeInTheDocument()
      expect(errorEl).toHaveTextContent('Invalid login credentials')
    })
  })

  it('does NOT call router.push on failure', async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: 'Wrong password' },
    })
    const { user } = setup()

    await user.type(screen.getByLabelText(/email/i), 'u@e.com')
    await user.type(screen.getByLabelText(/password/i), 'bad')
    await user.click(screen.getByTestId('login-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('login-error')).toBeInTheDocument()
    })
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('shows a client-side validation error for empty email on submit', async () => {
    const { user } = setup()

    await user.click(screen.getByTestId('login-submit'))

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    })
    expect(mockSignInWithPassword).not.toHaveBeenCalled()
  })

  it('shows a client-side validation error for empty password on submit', async () => {
    const { user } = setup()

    await user.type(screen.getByLabelText(/email/i), 'valid@example.com')
    await user.click(screen.getByTestId('login-submit'))

    await waitFor(() => {
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
    expect(mockSignInWithPassword).not.toHaveBeenCalled()
  })
})
