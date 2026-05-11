'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'

/**
 * SignOutButton — calls POST /api/auth/signout then redirects to /login.
 * Rendered in the AppHeader as plain text with hover underline.
 */
export function SignOutButton() {
  const router = useRouter()
  const [isPending, setIsPending] = React.useState(false)

  async function handleSignOut() {
    setIsPending(true)
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
    } catch {
      // Silently continue — signout always succeeds per API contract
    } finally {
      router.push('/login')
      router.refresh()
    }
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={isPending}
      className="text-sm text-ink-muted hover:text-ink underline-offset-2 hover:underline transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre rounded-sm"
    >
      {isPending ? 'signing out…' : 'sign out'}
    </button>
  )
}
