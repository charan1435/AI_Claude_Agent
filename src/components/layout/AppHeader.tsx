import * as React from 'react'
import { SignOutButton } from '@/components/auth/SignOutButton'

interface AppHeaderProps {
  /** Current month label e.g. "May 2026" */
  monthLabel: string
}

/**
 * AppHeader — top bar with brand, current month, and sign-out.
 * Hairline rule below separates it from the content.
 */
export function AppHeader({ monthLabel }: AppHeaderProps) {
  return (
    <header className="bg-paper border-b border-hairline">
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Brand */}
        <span className="font-display text-base tracking-[0.2em] uppercase text-ink select-none">
          Ledger
        </span>

        {/* Right side: month + sign out */}
        <div className="flex items-center gap-4 text-sm text-ink-muted font-sans">
          <span>{monthLabel}</span>
          <span className="text-hairline select-none" aria-hidden="true">·</span>
          <SignOutButton />
        </div>
      </div>
    </header>
  )
}
