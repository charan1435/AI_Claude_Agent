'use client'

import { useEffect } from 'react'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Dashboard error boundary.
 * Shown when the server component throws an unexpected error.
 */
export default function DashboardError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="font-display text-2xl text-ink mb-2">Something went wrong.</p>
        <p className="text-sm text-ink-muted font-sans mb-6">
          We couldn&apos;t load your expenses. Please try again.
        </p>
        <button
          onClick={reset}
          className="text-sm text-ochre font-sans underline underline-offset-2 hover:text-ochre/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre rounded-sm"
        >
          try again
        </button>
      </div>
    </div>
  )
}
