/**
 * PROJ-12: Component tests for CategoryBreakdown
 *
 * Tests:
 * - Renders correct currency-formatted amounts per category
 * - Computes correct percentages
 * - Dominant category (highest amount) gets full-opacity ochre (bg-ochre)
 * - Other categories get bg-ochre/50
 * - Handles zero total gracefully (no divide-by-zero)
 */
import * as React from 'react'
import { render, screen } from '@testing-library/react'
import { CategoryBreakdown } from '@/components/dashboard/CategoryBreakdown'
import type { ExpenseCategory } from '@/lib/validation/expense'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeByCategory(overrides: Partial<Record<ExpenseCategory, number>> = {}): Record<ExpenseCategory, number> {
  return {
    Food: 0,
    Transport: 0,
    Bills: 0,
    Other: 0,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CategoryBreakdown', () => {
  it('renders with correct testid', () => {
    render(<CategoryBreakdown byCategory={makeByCategory()} total={0} />)
    expect(screen.getByTestId('category-breakdown')).toBeInTheDocument()
  })

  it('renders all four category columns', () => {
    render(<CategoryBreakdown byCategory={makeByCategory()} total={0} />)
    expect(screen.getByTestId('category-food')).toBeInTheDocument()
    expect(screen.getByTestId('category-transport')).toBeInTheDocument()
    expect(screen.getByTestId('category-bills')).toBeInTheDocument()
    expect(screen.getByTestId('category-other')).toBeInTheDocument()
  })

  it('displays $0.00 for all categories when totals are zero', () => {
    render(<CategoryBreakdown byCategory={makeByCategory()} total={0} />)
    const zeros = screen.getAllByText('$0.00')
    expect(zeros).toHaveLength(4)
  })

  it('formats amounts correctly for each category', () => {
    const byCategory = makeByCategory({ Food: 120.0, Transport: 45.5, Bills: 177.0, Other: 0.0 })
    render(<CategoryBreakdown byCategory={byCategory} total={342.5} />)

    expect(screen.getByText('$120.00')).toBeInTheDocument()
    expect(screen.getByText('$45.50')).toBeInTheDocument()
    expect(screen.getByText('$177.00')).toBeInTheDocument()
    // Other = $0.00 — one of the four zeros (or the only zero shown in this case)
    expect(screen.getByText('$0.00')).toBeInTheDocument()
  })

  it('computes correct percentage for each category', () => {
    // Food = 50, Total = 100 → 50%
    // Transport = 25, Total = 100 → 25%
    // Bills = 25, Total = 100 → 25%
    const byCategory = makeByCategory({ Food: 50, Transport: 25, Bills: 25, Other: 0 })
    render(<CategoryBreakdown byCategory={byCategory} total={100} />)

    // Each progressbar aria-valuenow reflects the percentage
    const progressBars = screen.getAllByRole('progressbar')
    const values = progressBars.map((el) => Number(el.getAttribute('aria-valuenow')))
    expect(values).toContain(50)
    expect(values).toContain(25)
    expect(values).toContain(0)
  })

  it('shows 0% for all categories when total is 0 (no divide-by-zero)', () => {
    render(<CategoryBreakdown byCategory={makeByCategory()} total={0} />)
    const progressBars = screen.getAllByRole('progressbar')
    progressBars.forEach((bar) => {
      expect(bar).toHaveAttribute('aria-valuenow', '0')
    })
  })

  it('dominant category progressbar has bg-ochre class (full opacity)', () => {
    // Bills = 177 is the dominant category
    const byCategory = makeByCategory({ Food: 120, Transport: 45.5, Bills: 177, Other: 0 })
    render(<CategoryBreakdown byCategory={byCategory} total={342.5} />)

    // Find the progressbar for Bills — it is inside the category-bills container
    const billsContainer = screen.getByTestId('category-bills')
    const billsBar = billsContainer.querySelector('[role="progressbar"] > div')
    expect(billsBar).toHaveClass('bg-ochre')
    expect(billsBar).not.toHaveClass('bg-ochre/50')
  })

  it('non-dominant category progressbars have bg-ochre/50 class', () => {
    const byCategory = makeByCategory({ Food: 120, Transport: 45.5, Bills: 177, Other: 0 })
    render(<CategoryBreakdown byCategory={byCategory} total={342.5} />)

    const foodContainer = screen.getByTestId('category-food')
    const foodBar = foodContainer.querySelector('[role="progressbar"] > div')
    expect(foodBar).toHaveClass('bg-ochre/50')
  })

  it('when all amounts are 0 (no dominant), all bars use bg-ochre/50', () => {
    render(<CategoryBreakdown byCategory={makeByCategory()} total={0} />)

    const containers = [
      screen.getByTestId('category-food'),
      screen.getByTestId('category-transport'),
      screen.getByTestId('category-bills'),
      screen.getByTestId('category-other'),
    ]

    containers.forEach((container) => {
      const bar = container.querySelector('[role="progressbar"] > div')
      // When amount === 0, isDominant is false regardless of maxAmount
      // The dominant check is: amount > 0 && amount === maxAmount
      // So all zero-amount bars use bg-ochre/50
      expect(bar).toHaveClass('bg-ochre/50')
    })
  })

  it('Food is dominant when it has the highest amount', () => {
    const byCategory = makeByCategory({ Food: 200, Transport: 50, Bills: 100, Other: 30 })
    render(<CategoryBreakdown byCategory={byCategory} total={380} />)

    const foodContainer = screen.getByTestId('category-food')
    const foodBar = foodContainer.querySelector('[role="progressbar"] > div')
    expect(foodBar).toHaveClass('bg-ochre')

    const transportContainer = screen.getByTestId('category-transport')
    const transportBar = transportContainer.querySelector('[role="progressbar"] > div')
    expect(transportBar).toHaveClass('bg-ochre/50')
  })

  it('renders category labels in uppercase tracking style', () => {
    render(<CategoryBreakdown byCategory={makeByCategory({ Food: 10 })} total={10} />)
    // Labels "FOOD", "TRANSPORT", etc. are rendered as text — check for label text
    expect(screen.getByText('Food')).toBeInTheDocument()
    expect(screen.getByText('Transport')).toBeInTheDocument()
    expect(screen.getByText('Bills')).toBeInTheDocument()
    expect(screen.getByText('Other')).toBeInTheDocument()
  })

  it('rounds percentages to the nearest integer', () => {
    // 1/3 = 33.33...% → rounds to 33
    const byCategory = makeByCategory({ Food: 1, Transport: 1, Bills: 1, Other: 0 })
    render(<CategoryBreakdown byCategory={byCategory} total={3} />)

    const progressBars = screen.getAllByRole('progressbar')
    const nonZeroValues = progressBars
      .map((el) => Number(el.getAttribute('aria-valuenow')))
      .filter((v) => v > 0)

    nonZeroValues.forEach((v) => {
      expect(v).toBe(33)
    })
  })
})
