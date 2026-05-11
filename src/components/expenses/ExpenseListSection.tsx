'use client'

import * as React from 'react'
import { Suspense } from 'react'
import type { Expense } from '@/types/expense'
import { ExpenseList } from './ExpenseList'
import { ExpenseFilter } from './ExpenseFilter'
import { ExpenseSearch } from './ExpenseSearch'
import { ExpenseFormDialog } from './ExpenseFormDialog'
import { DeleteExpenseDialog } from './DeleteExpenseDialog'
import { EmptyState } from './EmptyState'
import { AddExpenseButton } from '@/components/dashboard/AddExpenseButton'

interface ExpenseListSectionProps {
  expenses: Expense[]
  hasActiveFilter: boolean
}

/**
 * ExpenseListSection — client component that hosts:
 * - Filter pills (URL-synced)
 * - Search input (debounced, URL-synced)
 * - Expense list with overflow menus
 * - Add / Edit dialog
 * - Delete confirm dialog
 * - Empty state
 */
export function ExpenseListSection({
  expenses,
  hasActiveFilter,
}: ExpenseListSectionProps) {
  // Dialog state
  const [addOpen, setAddOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [editingExpense, setEditingExpense] = React.useState<Expense | null>(null)
  const [deletingExpense, setDeletingExpense] = React.useState<Expense | null>(null)

  function handleEdit(expense: Expense) {
    setEditingExpense(expense)
    setEditOpen(true)
  }

  function handleDelete(expense: Expense) {
    setDeletingExpense(expense)
    setDeleteOpen(true)
  }

  return (
    <section aria-label="Expenses" data-testid="expense-list-section">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-sans text-ink">Recent</h2>
        <AddExpenseButton onClick={() => setAddOpen(true)} />
      </div>

      {/* Filter + Search */}
      <div className="flex flex-col gap-3 mb-4">
        <Suspense fallback={<div className="h-7 bg-hairline/30 rounded-sm animate-pulse w-64" />}>
          <ExpenseFilter />
        </Suspense>
        <div className="max-w-xs">
          <Suspense fallback={<div className="h-7 bg-hairline/30 rounded-sm animate-pulse w-48" />}>
            <ExpenseSearch />
          </Suspense>
        </div>
      </div>

      {/* Hairline before list */}
      <div className="border-t border-hairline" />

      {/* List or empty state */}
      {expenses.length === 0 ? (
        <EmptyState
          hasActiveFilter={hasActiveFilter}
          onAddExpense={() => setAddOpen(true)}
        />
      ) : (
        <ExpenseList
          expenses={expenses}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Add Expense Dialog */}
      <ExpenseFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        mode="create"
      />

      {/* Edit Expense Dialog */}
      <ExpenseFormDialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open)
          if (!open) setEditingExpense(null)
        }}
        mode="edit"
        initialValues={editingExpense ?? undefined}
      />

      {/* Delete Confirm Dialog */}
      <DeleteExpenseDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open)
          if (!open) setDeletingExpense(null)
        }}
        expense={deletingExpense}
      />
    </section>
  )
}
