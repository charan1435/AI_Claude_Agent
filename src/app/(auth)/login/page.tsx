import { AuthShell } from '@/components/layout/AuthShell'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata = {
  title: 'Sign in — Ledger',
}

/**
 * /login — Sign-in page.
 * Renders the centered AuthShell with the Ledger wordmark and the LoginForm.
 */
export default function LoginPage() {
  return (
    <AuthShell>
      <LoginForm />
    </AuthShell>
  )
}
