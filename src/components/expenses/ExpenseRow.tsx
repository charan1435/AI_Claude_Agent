'use client'

import * as React from 'react'
import type { Expense } from '@/types/expense'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { formatAmount, formatDate } from '@/lib/formatters'

interface ExpenseRowProps {
  expense: Expense
  onEdit: (expense: Expense) => void
  onDelete: (expense: Expense) => void
  /** Animation stagger delay in ms */
  animationDelay?: number
}

/**
 * ExpenseRow — single list row.
 * Layout: date · CATEGORY · amount (mono, right-aligned) · note (truncated) · ⋯ menu
 * Hairline border-bottom, no zebra striping.
 */
export function ExpenseRow({ expense, onEdit, onDelete, animationDelay = 0 }: ExpenseRowProps) {
  return (
    <div
      className="animate-row-fade opacity-0 border-b border-hairline last:border-b-0"
      style={{ animationDelay: `${animationDelay}ms`, animationFillMode: 'forwards' }}
      data-testid="expense-row"
      data-expense-id={expense.id}
    >
      <div className="flex items-center gap-3 py-3 px-0">
        {/* Date */}
        <span className="w-14 shrink-0 text-xs text-ink-muted font-sans">
          {formatDate(expense.spent_on)}
        </span>

        {/* Category */}
        <span className="w-24 shrink-0 text-xs tracking-widest uppercase text-ink-muted font-sans">
          {expense.category}
        </span>

        {/* Amount — monospace, tabular, right-aligned on the left group */}
        <span className="w-24 shrink-0 text-sm font-mono tabular-nums text-ink text-right">
          {formatAmount(expense.amount)}
        </span>

        {/* Note — truncated, fills remaining space */}
        <span className="flex-1 text-sm text-ink-muted font-sans truncate min-w-0">
          {expense.note ?? ''}
        </span>

        {/* Overflow menu ⋯ */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className="shrink-0 flex items-center justify-center size-7 rounded-sm text-ink-muted hover:text-ink hover:bg-hairline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre"
            aria-label={`Options for ${expense.category} expense on ${expense.spent_on}`}
            data-testid="expense-row-menu"
          >
            <MoreHorizontalIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="bottom" sideOffset={4}>
            <DropdownMenuItem
              onClick={() => onEdit(expense)}
              data-testid="expense-edit"
            >
              <PencilIcon className="size-3.5 mr-1.5 text-ink-muted" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete(expense)}
              data-testid="expense-delete"
            >
              <Trash2Icon className="size-3.5 mr-1.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
