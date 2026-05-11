'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { Expense } from '@/types/expense'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'

interface DeleteExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense: Expense | null
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * DeleteExpenseDialog — destructive confirm dialog.
 * Shows expense summary: amount · CATEGORY · date + note.
 * Confirm button is oxblood. Cancel is outline.
 * On confirm: DELETE /api/expenses/[id] → close + toast + router.refresh().
 */
export function DeleteExpenseDialog({
  open,
  onOpenChange,
  expense,
}: DeleteExpenseDialogProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = React.useState(false)

  async function handleDelete() {
    if (!expense) return
    setIsDeleting(true)

    try {
      const res = await fetch(`/api/expenses/${expense.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({ error: 'Delete failed' }))
        toast.error(
          typeof json.error === 'string' ? json.error : 'Could not delete expense.'
        )
        return
      }

      onOpenChange(false)
      toast.success('Expense deleted.')
      router.refresh()
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className="rounded-sm ring-hairline"
        data-testid="delete-expense-dialog"
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-xl font-normal text-ink">
            Delete this expense?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-ink-muted font-sans">
            This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Expense summary */}
        {expense && (
          <div className="px-0 py-2 flex flex-col gap-1">
            <p className="text-sm font-mono tabular-nums text-ink">
              {formatAmount(expense.amount)}
              <span className="text-ink-muted mx-2">·</span>
              <span className="uppercase tracking-wider text-xs font-sans">
                {expense.category}
              </span>
              <span className="text-ink-muted mx-2">·</span>
              {formatDate(expense.spent_on)}
            </p>
            {expense.note && (
              <p className="text-sm text-ink-muted font-sans">{expense.note}</p>
            )}
          </div>
        )}

        <AlertDialogFooter className="-mx-4 -mb-4 flex flex-row justify-between border-t border-hairline px-4 py-3 bg-transparent">
          <AlertDialogCancel variant="outline" size="default">
            cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            data-testid="delete-confirm"
          >
            {isDeleting ? 'deleting…' : 'delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
