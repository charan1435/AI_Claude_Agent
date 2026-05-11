import { EXPENSE_CATEGORIES, type ExpenseCategory } from '@/lib/validation/expense'

export interface MonthBoundaries {
  /** YYYY-MM label, e.g. "2026-05" */
  monthLabel: string
  /** Inclusive lower bound (YYYY-MM-DD) — first day of the month */
  monthStart: string
  /** Inclusive upper bound (YYYY-MM-DD) — last day of the month */
  monthEndInclusive: string
  /** Exclusive upper bound (YYYY-MM-DD) — first day of the next month */
  monthEndExclusive: string
}

export interface MonthlyTotals {
  total: number
  byCategory: Record<ExpenseCategory, number>
}

/**
 * Compute current-month date boundaries in the supplied IANA timezone.
 * Falls back to UTC if the timezone string is invalid.
 *
 * Returns both an inclusive and exclusive upper bound so callers can pick
 * the right one for their query operator (.lte vs .lt).
 */
export function getCurrentMonthBoundaries(timezone: string = 'UTC'): MonthBoundaries {
  let year: number
  let month: number

  try {
    const localDateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date())
    const [y, m] = localDateStr.split('-').map(Number)
    year = y
    month = m
  } catch {
    const now = new Date()
    year = now.getUTCFullYear()
    month = now.getUTCMonth() + 1
  }

  const mm = String(month).padStart(2, '0')
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year

  return {
    monthLabel: `${year}-${mm}`,
    monthStart: `${year}-${mm}-01`,
    monthEndInclusive: `${year}-${mm}-${String(lastDay).padStart(2, '0')}`,
    monthEndExclusive: `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`,
  }
}

/**
 * Aggregate `{ amount, category }` rows into a total and per-category breakdown,
 * rounded to 2 decimal places.
 */
export function aggregateMonthlyTotals(
  rows: ReadonlyArray<{ amount: number | string; category: string }>
): MonthlyTotals {
  const byCategory: Record<ExpenseCategory, number> = {
    Food: 0,
    Transport: 0,
    Bills: 0,
    Other: 0,
  }
  let total = 0

  for (const row of rows) {
    const amount = Number(row.amount)
    if (Number.isNaN(amount)) continue
    total += amount
    const cat = row.category as ExpenseCategory
    if (EXPENSE_CATEGORIES.includes(cat)) {
      byCategory[cat] += amount
    }
  }

  total = round2(total)
  for (const cat of EXPENSE_CATEGORIES) {
    byCategory[cat] = round2(byCategory[cat])
  }

  return { total, byCategory }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
