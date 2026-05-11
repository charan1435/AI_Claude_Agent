/**
 * PROJ-12: Component tests for EmptyState
 *
 * Tests:
 * - Shows "no expenses yet" message when no filter is active
 * - Shows "no expenses match" message when filter is active
 * - Shows add expense CTA only when no active filter and callback provided
 */
import * as React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmptyState } from '@/components/expenses/EmptyState'

describe('EmptyState', () => {
  it('renders with correct testid', () => {
    render(<EmptyState />)
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
  })

  it('shows "no expenses yet" message when no filter is active', () => {
    render(<EmptyState hasActiveFilter={false} />)
    expect(screen.getByText(/no expenses yet/i)).toBeInTheDocument()
  })

  it('shows "no expenses match" message when filter is active', () => {
    render(<EmptyState hasActiveFilter={true} />)
    expect(screen.getByText(/no expenses match/i)).toBeInTheDocument()
  })

  it('shows add expense CTA when no filter and callback is provided', () => {
    const onAdd = jest.fn()
    render(<EmptyState hasActiveFilter={false} onAddExpense={onAdd} />)
    expect(screen.getByTestId('empty-add-expense')).toBeInTheDocument()
  })

  it('calls onAddExpense when the add CTA is clicked', async () => {
    const onAdd = jest.fn()
    const user = userEvent.setup()
    render(<EmptyState hasActiveFilter={false} onAddExpense={onAdd} />)
    await user.click(screen.getByTestId('empty-add-expense'))
    expect(onAdd).toHaveBeenCalledTimes(1)
  })

  it('does NOT show add expense CTA when filter is active', () => {
    const onAdd = jest.fn()
    render(<EmptyState hasActiveFilter={true} onAddExpense={onAdd} />)
    expect(screen.queryByTestId('empty-add-expense')).not.toBeInTheDocument()
  })

  it('does NOT show add expense CTA when no callback is provided', () => {
    render(<EmptyState hasActiveFilter={false} />)
    expect(screen.queryByTestId('empty-add-expense')).not.toBeInTheDocument()
  })
})
