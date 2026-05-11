/**
 * PROJ-12: Component tests for MonthlyTotal
 *
 * Tests:
 * - Renders the correct currency-formatted total
 * - Renders the "this month" label
 * - Accessible aria-label contains the formatted total
 */
import * as React from 'react'
import { render, screen } from '@testing-library/react'
import { MonthlyTotal } from '@/components/dashboard/MonthlyTotal'

describe('MonthlyTotal', () => {
  it('renders with correct testid', () => {
    render(<MonthlyTotal total={0} />)
    expect(screen.getByTestId('monthly-total')).toBeInTheDocument()
  })

  it('renders the "this month" label', () => {
    render(<MonthlyTotal total={100} />)
    expect(screen.getByText(/this month/i)).toBeInTheDocument()
  })

  it('formats a whole number total as currency with 2 decimal places', () => {
    render(<MonthlyTotal total={100} />)
    expect(screen.getByText('$100.00')).toBeInTheDocument()
  })

  it('formats a decimal total correctly', () => {
    render(<MonthlyTotal total={1247.30} />)
    expect(screen.getByText('$1,247.30')).toBeInTheDocument()
  })

  it('formats zero correctly', () => {
    render(<MonthlyTotal total={0} />)
    expect(screen.getByText('$0.00')).toBeInTheDocument()
  })

  it('formats a large total with comma separators', () => {
    render(<MonthlyTotal total={12345.67} />)
    expect(screen.getByText('$12,345.67')).toBeInTheDocument()
  })

  it('renders the accessible aria-label containing the formatted total', () => {
    render(<MonthlyTotal total={342.5} />)
    const ariaEl = screen.getByLabelText(/total spent this month/i)
    expect(ariaEl).toBeInTheDocument()
    expect(ariaEl).toHaveTextContent('$342.50')
  })

  it('formats 0.99 correctly', () => {
    render(<MonthlyTotal total={0.99} />)
    expect(screen.getByText('$0.99')).toBeInTheDocument()
  })

  it('formats a single-digit cent amount correctly', () => {
    render(<MonthlyTotal total={5.05} />)
    expect(screen.getByText('$5.05')).toBeInTheDocument()
  })

  it('renders a different total when prop changes', () => {
    const { rerender } = render(<MonthlyTotal total={50} />)
    expect(screen.getByText('$50.00')).toBeInTheDocument()

    rerender(<MonthlyTotal total={75.25} />)
    expect(screen.getByText('$75.25')).toBeInTheDocument()
  })
})
