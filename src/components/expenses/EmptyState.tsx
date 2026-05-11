import * as React from 'react'

interface EmptyStateProps {
  /** Whether we're showing empty because of an active filter/search */
  hasActiveFilter?: boolean
  /** Callback to open the add expense dialog */
  onAddExpense?: () => void
}

/**
 * EmptyState — shown when the expense list is empty.
 * If no filters active: "no expenses yet. add your first to start your ledger."
 * If filters active: "no expenses match your filter."
 */
export function EmptyState({ hasActiveFilter, onAddExpense }: EmptyStateProps) {
  return (
    <div
      className="py-16 flex flex-col items-center gap-4 text-center"
      data-testid="empty-state"
    >
      <p className="text-sm text-ink-muted font-sans max-w-xs">
        {hasActiveFilter
          ? 'no expenses match your current filter or search.'
          : 'no expenses yet. add your first to start your ledger.'}
      </p>
      {!hasActiveFilter && onAddExpense && (
        <button
          onClick={onAddExpense}
          className="text-sm text-ochre font-sans underline underline-offset-2 hover:text-ochre/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre rounded-sm"
          data-testid="empty-add-expense"
        >
          + add expense
        </button>
      )}
    </div>
  )
}
