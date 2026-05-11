import * as React from 'react'

interface AuthShellProps {
  children: React.ReactNode
}

/**
 * AuthShell — centered narrow column for /login and /signup.
 * No card chrome — just hairline rules above and below the form group.
 * The Ledger wordmark sits above.
 */
export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center px-4">
      {/* Wordmark */}
      <div className="mb-8 text-center">
        <h1 className="font-display text-2xl tracking-[0.25em] uppercase text-ink">
          L E D G E R
        </h1>
        <p className="mt-1 text-xs tracking-widest text-ink-muted uppercase font-sans">
          a quiet place for your money
        </p>
      </div>

      {/* Form container — hairline rules above and below, no card box */}
      <div className="w-full max-w-md">
        <div className="border-t border-hairline pt-8 pb-8 border-b">
          {children}
        </div>
      </div>
    </div>
  )
}
