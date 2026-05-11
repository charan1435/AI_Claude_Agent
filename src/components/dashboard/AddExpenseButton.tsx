'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { PlusIcon } from 'lucide-react'

interface AddExpenseButtonProps {
  onClick: () => void
}

/**
 * AddExpenseButton — primary CTA on the dashboard header.
 * Ochre background, sharp corners. Triggers the ExpenseFormDialog.
 */
export function AddExpenseButton({ onClick }: AddExpenseButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant="default"
      size="default"
      className="shrink-0"
      data-testid="add-expense-button"
    >
      <PlusIcon className="size-4" />
      add expense
    </Button>
  )
}
