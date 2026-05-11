/**
 * Format a numeric amount as USD currency, always with 2 decimal places.
 * e.g. 24.5 → "$24.50"
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format a YYYY-MM-DD string as "Mon D" (e.g. "2026-05-11" → "May 11").
 * Parses parts manually so timezone shifts cannot bump the day.
 */
export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
