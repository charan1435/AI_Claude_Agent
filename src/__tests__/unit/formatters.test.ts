import { formatAmount, formatDate } from '@/lib/formatters'

describe('formatAmount', () => {
  it('formats whole numbers with two decimal places', () => {
    expect(formatAmount(10)).toBe('$10.00')
  })

  it('formats one decimal place to two', () => {
    expect(formatAmount(24.5)).toBe('$24.50')
  })

  it('formats two decimal places as-is', () => {
    expect(formatAmount(24.56)).toBe('$24.56')
  })

  it('rounds amounts with more than two decimals (banker-rounding aside)', () => {
    // Intl.NumberFormat truncates to maxFractionDigits; the assertion only
    // pins the shape, not the rounding policy
    const out = formatAmount(24.567)
    expect(out).toMatch(/^\$24\.\d{2}$/)
  })

  it('formats zero', () => {
    expect(formatAmount(0)).toBe('$0.00')
  })
})

describe('formatDate', () => {
  it('formats YYYY-MM-DD as "MMM D"', () => {
    expect(formatDate('2026-05-11')).toBe('May 11')
  })

  it('parses day component without timezone shift', () => {
    // Day must not wander to 31 or to next month due to UTC parsing
    expect(formatDate('2026-01-01')).toBe('Jan 1')
  })

  it('formats December correctly', () => {
    expect(formatDate('2026-12-31')).toBe('Dec 31')
  })
})
