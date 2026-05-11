import * as React from 'react'
import type { Expense } from '@/types/expense'
import { ExpenseRow } from './ExpenseRow'

interface ExpenseListProps {
  expenses: Expense[]
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
}

/**
 * ExpenseList — renders the list of expense rows.
 * Not a <table> — uses flexbox with role-appropriate semantics.
 * Hairline separators between rows; no zebra striping.
 */
export function ExpenseList({ expenses, onEdit, onDelete }: ExpenseListProps) {
  return (
    <div
      role="list"
      aria-label="Expenses"
      data-testid="expense-list"
    >
      {expenses.map((expense, idx) => (
        <div key={expense.id} role="listitem">
          <ExpenseRow
            expense={expense}
            onEdit={onEdit}
            onDelete={onDelete}
            animationDelay={idx * 40}
          />
        </div>
      ))}
    </div>
  )
}
