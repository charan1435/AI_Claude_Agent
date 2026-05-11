import {
  aggregateMonthlyTotals,
  getCurrentMonthBoundaries,
} from '@/lib/expense-aggregation'

describe('getCurrentMonthBoundaries', () => {
  it('returns YYYY-MM-DD strings and a YYYY-MM label for UTC', () => {
    const b = getCurrentMonthBoundaries('UTC')
    expect(b.monthLabel).toMatch(/^\d{4}-\d{2}$/)
    expect(b.monthStart).toMatch(/^\d{4}-\d{2}-01$/)
    expect(b.monthEndInclusive).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(b.monthEndExclusive).toMatch(/^\d{4}-\d{2}-01$/)
  })

  it('start and exclusive-end are in different months (one month apart)', () => {
    const b = getCurrentMonthBoundaries('UTC')
    const startMonth = b.monthStart.slice(0, 7)
    const endExclMonth = b.monthEndExclusive.slice(0, 7)
    expect(startMonth).not.toBe(endExclMonth)
  })

  it('inclusive end is in the same month as start', () => {
    const b = getCurrentMonthBoundaries('UTC')
    expect(b.monthEndInclusive.slice(0, 7)).toBe(b.monthStart.slice(0, 7))
  })

  it('falls back to UTC when the timezone is invalid', () => {
    const fallback = getCurrentMonthBoundaries('Not/AReal_Zone')
    const utc = getCurrentMonthBoundaries('UTC')
    expect(fallback.monthLabel).toBe(utc.monthLabel)
    expect(fallback.monthStart).toBe(utc.monthStart)
    expect(fallback.monthEndExclusive).toBe(utc.monthEndExclusive)
  })

  it('defaults to UTC when no timezone is supplied', () => {
    const def = getCurrentMonthBoundaries()
    const utc = getCurrentMonthBoundaries('UTC')
    expect(def.monthStart).toBe(utc.monthStart)
  })

  it('accepts a valid IANA timezone without throwing', () => {
    expect(() => getCurrentMonthBoundaries('America/New_York')).not.toThrow()
    const b = getCurrentMonthBoundaries('America/New_York')
    expect(b.monthStart).toMatch(/^\d{4}-\d{2}-01$/)
  })
})

describe('aggregateMonthlyTotals', () => {
  it('returns zero totals for an empty input', () => {
    const result = aggregateMonthlyTotals([])
    expect(result.total).toBe(0)
    expect(result.byCategory).toEqual({
      Food: 0,
      Transport: 0,
      Bills: 0,
      Other: 0,
    })
  })

  it('sums amounts across categories and computes total', () => {
    const result = aggregateMonthlyTotals([
      { amount: 10, category: 'Food' },
      { amount: 5.5, category: 'Food' },
      { amount: 20, category: 'Bills' },
      { amount: 3, category: 'Other' },
    ])
    expect(result.byCategory.Food).toBe(15.5)
    expect(result.byCategory.Bills).toBe(20)
    expect(result.byCategory.Other).toBe(3)
    expect(result.byCategory.Transport).toBe(0)
    expect(result.total).toBe(38.5)
  })

  it('accepts amounts as strings (Supabase numeric → string)', () => {
    const result = aggregateMonthlyTotals([
      { amount: '12.34', category: 'Food' },
      { amount: '0.66', category: 'Food' },
    ])
    expect(result.byCategory.Food).toBe(13)
    expect(result.total).toBe(13)
  })

  it('rounds totals to 2 decimal places', () => {
    const result = aggregateMonthlyTotals([
      { amount: 0.1, category: 'Food' },
      { amount: 0.2, category: 'Food' },
    ])
    expect(result.byCategory.Food).toBe(0.3)
    expect(result.total).toBe(0.3)
  })

  it('silently ignores unknown categories', () => {
    const result = aggregateMonthlyTotals([
      { amount: 100, category: 'Mystery' },
      { amount: 10, category: 'Food' },
    ])
    expect(result.byCategory.Food).toBe(10)
    // total still counts unknown rows, byCategory does not
    expect(result.total).toBe(110)
  })

  it('skips rows whose amount is not a number', () => {
    const result = aggregateMonthlyTotals([
      { amount: 'abc', category: 'Food' },
      { amount: 5, category: 'Food' },
    ])
    expect(result.byCategory.Food).toBe(5)
    expect(result.total).toBe(5)
  })
})
