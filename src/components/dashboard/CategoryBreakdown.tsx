import * as React from 'react'
import type { ExpenseCategory } from '@/lib/validation/expense'

interface CategoryBreakdownProps {
  byCategory: Record<ExpenseCategory, number>
  total: number
}

const CATEGORIES: ExpenseCategory[] = ['Food', 'Transport', 'Bills', 'Other']

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

/**
 * CategoryBreakdown — four-column block with bar + amount + %.
 * The dominant (largest) category bar is full ochre; others are ochre at 50% opacity.
 * Bars wipe left-to-right on mount (240ms + 60ms stagger per column).
 */
export function CategoryBreakdown({ byCategory, total }: CategoryBreakdownProps) {
  // Find the dominant category
  const maxAmount = Math.max(...CATEGORIES.map((c) => byCategory[c] ?? 0))

  return (
    <div
      className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4"
      role="region"
      aria-label="Category breakdown"
      data-testid="category-breakdown"
    >
      {CATEGORIES.map((cat, idx) => {
        const amount = byCategory[cat] ?? 0
        const pct = total > 0 ? Math.round((amount / total) * 100) : 0
        const isDominant = amount > 0 && amount === maxAmount

        return (
          <div
            key={cat}
            className="flex flex-col gap-1.5 animate-fade-slide-up opacity-0"
            style={{
              animationDelay: `${60 + idx * 60}ms`,
              animationFillMode: 'forwards',
            }}
            data-testid={`category-${cat.toLowerCase()}`}
          >
            {/* Category label */}
            <p className="text-xs tracking-widest uppercase text-ink-muted font-sans">
              {cat}
            </p>

            {/* Amount */}
            <p className="font-mono text-sm text-ink tabular-nums">
              {formatAmount(amount)}
            </p>

            {/* Bar */}
            <div
              className="h-1 bg-hairline rounded-none overflow-hidden"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${cat}: ${pct}%`}
            >
              <div
                className={`h-full animate-bar-wipe ${
                  isDominant ? 'bg-ochre' : 'bg-ochre/50'
                }`}
                style={{
                  width: `${pct}%`,
                  animationDelay: `${120 + idx * 60}ms`,
                  animationFillMode: 'forwards',
                }}
              />
            </div>

            {/* Percentage */}
            <p className="text-xs text-ink-muted font-mono tabular-nums">
              {pct}&thinsp;%
            </p>
          </div>
        )
      })}
    </div>
  )
}
