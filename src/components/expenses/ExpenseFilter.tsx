'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { EXPENSE_CATEGORIES, type ExpenseCategory } from '@/lib/validation/expense'

type FilterValue = ExpenseCategory | 'all'

const FILTER_OPTIONS: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'all' },
  ...EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c.toLowerCase() })),
]

/**
 * ExpenseFilter — category pill row that updates the URL ?category= param.
 * Active pill: ink bg, paper text. Inactive: muted text, hairline border.
 */
export function ExpenseFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeCategory = searchParams.get('category') as FilterValue | null

  function handleFilter(value: FilterValue) {
    const params = new URLSearchParams(searchParams.toString())

    if (value === 'all') {
      params.delete('category')
    } else {
      params.set('category', value)
    }

    router.push(`/?${params.toString()}`)
  }

  const activeValue: FilterValue = activeCategory ?? 'all'

  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Filter by category"
      data-testid="expense-filter"
    >
      {FILTER_OPTIONS.map(({ value, label }) => {
        const isActive = value === activeValue
        return (
          <button
            key={value}
            onClick={() => handleFilter(value)}
            role="radio"
            aria-checked={isActive}
            className={cn(
              'px-3 py-1 text-xs font-sans tracking-wide uppercase rounded-sm border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre',
              isActive
                ? 'bg-ink text-paper border-ink'
                : 'bg-transparent text-ink-muted border-hairline hover:border-ink-muted hover:text-ink'
            )}
            data-testid={`filter-${value}`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
