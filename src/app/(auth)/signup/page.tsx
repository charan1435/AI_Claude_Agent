import { AuthShell } from '@/components/layout/AuthShell'
import { SignupForm } from '@/components/auth/SignupForm'

export const metadata = {
  title: 'Create account — Ledger',
}

/**
 * /signup — Sign-up page.
 * Same shape as login, with email + password + confirm password.
 */
export default function SignupPage() {
  return (
    <AuthShell>
      <SignupForm />
    </AuthShell>
  )
}
