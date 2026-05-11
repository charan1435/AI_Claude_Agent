/**
 * PROJ-12: Component tests for ExpenseList and ExpenseRow
 *
 * Tests:
 * - ExpenseList renders all expenses with role="list"
 * - ExpenseRow renders amount, category, date, and note
 * - Edit and Delete callbacks fire correctly
 */
import * as React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Expense } from '@/types/expense'
import { ExpenseList } from '@/components/expenses/ExpenseList'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock the dropdown menu used in ExpenseRow — render inline buttons instead
jest.mock('@/components/ui/dropdown-menu', () => {
  const React = require('react')
  const DropdownMenu = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
  const DropdownMenuTrigger = ({ children, ...props }: { children: React.ReactNode; [k: string]: unknown }) => (
    <button {...props}>{children}</button>
  )
  const DropdownMenuContent = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dropdown-content">{children}</div>
  )
  const DropdownMenuItem = ({
    children,
    onClick,
    ...props
  }: {
    children: React.ReactNode
    onClick?: () => void
    [k: string]: unknown
  }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  )
  const DropdownMenuSeparator = () => <hr />

  return {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
  }
})

jest.mock('lucide-react', () => ({
  MoreHorizontalIcon: () => <span>...</span>,
  PencilIcon: () => <span>edit-icon</span>,
  Trash2Icon: () => <span>trash-icon</span>,
  SearchIcon: () => <span>S</span>,
  XIcon: () => <span>X</span>,
}))

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const EXPENSES: Expense[] = [
  {
    id: 'exp-001',
    user_id: 'user-1',
    amount: 12.5,
    category: 'Food',
    spent_on: '2026-05-11',
    note: 'Lunch salad',
    created_at: '2026-05-11T12:00:00Z',
    updated_at: '2026-05-11T12:00:00Z',
  },
  {
    id: 'exp-002',
    user_id: 'user-1',
    amount: 45.0,
    category: 'Transport',
    spent_on: '2026-05-10',
    note: 'Uber ride',
    created_at: '2026-05-10T08:00:00Z',
    updated_at: '2026-05-10T08:00:00Z',
  },
  {
    id: 'exp-003',
    user_id: 'user-1',
    amount: 100.0,
    category: 'Bills',
    spent_on: '2026-05-09',
    note: null,
    created_at: '2026-05-09T06:00:00Z',
    updated_at: '2026-05-09T06:00:00Z',
  },
]

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ExpenseList', () => {
  it('renders with role="list"', () => {
    render(<ExpenseList expenses={EXPENSES} onEdit={jest.fn()} onDelete={jest.fn()} />)
    expect(screen.getByRole('list')).toBeInTheDocument()
  })

  it('renders with correct testid', () => {
    render(<ExpenseList expenses={EXPENSES} onEdit={jest.fn()} onDelete={jest.fn()} />)
    expect(screen.getByTestId('expense-list')).toBeInTheDocument()
  })

  it('renders the correct number of expense rows', () => {
    render(<ExpenseList expenses={EXPENSES} onEdit={jest.fn()} onDelete={jest.fn()} />)
    const rows = screen.getAllByTestId('expense-row')
    expect(rows).toHaveLength(3)
  })

  it('renders each expense amount formatted as currency', () => {
    render(<ExpenseList expenses={EXPENSES} onEdit={jest.fn()} onDelete={jest.fn()} />)
    expect(screen.getByText('$12.50')).toBeInTheDocument()
    expect(screen.getByText('$45.00')).toBeInTheDocument()
    expect(screen.getByText('$100.00')).toBeInTheDocument()
  })

  it('renders each expense category', () => {
    render(<ExpenseList expenses={EXPENSES} onEdit={jest.fn()} onDelete={jest.fn()} />)
    expect(screen.getByText('Food')).toBeInTheDocument()
    expect(screen.getByText('Transport')).toBeInTheDocument()
    expect(screen.getByText('Bills')).toBeInTheDocument()
  })

  it('renders note text when present', () => {
    render(<ExpenseList expenses={EXPENSES} onEdit={jest.fn()} onDelete={jest.fn()} />)
    expect(screen.getByText('Lunch salad')).toBeInTheDocument()
    expect(screen.getByText('Uber ride')).toBeInTheDocument()
  })

  it('renders empty string when note is null', () => {
    render(<ExpenseList expenses={EXPENSES} onEdit={jest.fn()} onDelete={jest.fn()} />)
    // The null note row should still render without crashing
    const rows = screen.getAllByTestId('expense-row')
    expect(rows).toHaveLength(3)
  })

  it('renders an empty list without error when expenses array is empty', () => {
    render(<ExpenseList expenses={[]} onEdit={jest.fn()} onDelete={jest.fn()} />)
    expect(screen.getByTestId('expense-list')).toBeInTheDocument()
    expect(screen.queryByTestId('expense-row')).not.toBeInTheDocument()
  })

  it('calls onEdit with the correct expense when edit is clicked', async () => {
    const onEdit = jest.fn()
    const user = userEvent.setup()
    render(<ExpenseList expenses={EXPENSES} onEdit={onEdit} onDelete={jest.fn()} />)

    const editButtons = screen.getAllByTestId('expense-edit')
    await user.click(editButtons[0])
    expect(onEdit).toHaveBeenCalledWith(EXPENSES[0])
  })

  it('calls onDelete with the correct expense when delete is clicked', async () => {
    const onDelete = jest.fn()
    const user = userEvent.setup()
    render(<ExpenseList expenses={EXPENSES} onEdit={jest.fn()} onDelete={onDelete} />)

    const deleteButtons = screen.getAllByTestId('expense-delete')
    await user.click(deleteButtons[1])
    expect(onDelete).toHaveBeenCalledWith(EXPENSES[1])
  })
})
