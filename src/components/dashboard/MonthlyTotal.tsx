import * as React from 'react'

interface MonthlyTotalProps {
  /** Total amount for the current month, e.g. 1247.30 */
  total: number
}

/**
 * MonthlyTotal — the visual hero of the dashboard.
 * Large Newsreader numeral (64px) with a "this month" label above in IBM Plex Sans.
 * Stagger animation: fades up on mount (180ms).
 */
export function MonthlyTotal({ total }: MonthlyTotalProps) {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(total)

  return (
    <div
      className="animate-fade-slide-up opacity-0"
      style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}
      data-testid="monthly-total"
    >
      <p className="text-xs tracking-widest uppercase text-ink-muted font-sans mb-1">
        this month
      </p>
      <p
        className="font-display text-6xl font-normal text-ink leading-none tabular-nums"
        aria-label={`Total spent this month: ${formatted}`}
      >
        {formatted}
      </p>
    </div>
  )
}
