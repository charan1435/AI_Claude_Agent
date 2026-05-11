'use client'

import * as React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { Expense } from '@/types/expense'
import type { ExpenseCategory } from '@/lib/validation/expense'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogBody,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AmountInput } from '@/components/forms/AmountInput'
import { CategoryPicker } from '@/components/forms/CategoryPicker'
import { DateInput } from '@/components/forms/DateInput'
import { NoteInput } from '@/components/forms/NoteInput'

type Mode = 'create' | 'edit'

interface ExpenseFormValues {
  amount: string
  category: ExpenseCategory
  spent_on: string
  note: string
}

interface ExpenseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: Mode
  initialValues?: Partial<Expense>
}

interface ExpenseFormInnerProps {
  mode: Mode
  initialValues?: Partial<Expense>
  onClose: () => void
}

function todayISO(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Inner form component — remounted via `key` when the dialog opens.
 * This avoids needing effects to reset form state.
 */
function ExpenseFormInner({ mode, initialValues, onClose }: ExpenseFormInnerProps) {
  const router = useRouter()
  const [serverError, setServerError] = React.useState<string | null>(null)

  const defaultValues: ExpenseFormValues = {
    amount: initialValues?.amount != null ? String(initialValues.amount) : '',
    category: (initialValues?.category as ExpenseCategory) ?? 'Food',
    spent_on: initialValues?.spent_on ?? todayISO(),
    note: initialValues?.note ?? '',
  }

  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({ defaultValues })

  async function onSubmit(values: ExpenseFormValues) {
    setServerError(null)

    const amountNum = parseFloat(values.amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      return
    }

    const body = {
      amount: amountNum,
      category: values.category,
      spent_on: values.spent_on,
      note: values.note.trim() || null,
    }

    let res: Response
    if (mode === 'create') {
      res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    } else {
      res = await fetch(`/api/expenses/${initialValues!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    }

    const json = await res.json()

    if (!res.ok || json.error) {
      const errorMsg =
        typeof json.error === 'string'
          ? json.error
          : 'Something went wrong. Please try again.'
      setServerError(errorMsg)
      return
    }

    onClose()
    toast.success(mode === 'create' ? 'Expense added.' : 'Expense updated.')
    router.refresh()
  }

  const title = mode === 'create' ? 'Add expense' : 'Edit expense'
  const submitLabel = mode === 'create' ? 'save' : 'save changes'
  const canSubmit = !errors.amount && !isSubmitting

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription className="sr-only">
          {mode === 'create'
            ? 'Fill in the details to add a new expense.'
            : 'Edit the expense details.'}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogBody>
          {/* Amount */}
          <Controller
            name="amount"
            control={control}
            rules={{
              required: 'Amount is required',
              validate: (v) => {
                const n = parseFloat(v)
                if (isNaN(n) || n <= 0) return 'Amount must be greater than 0'
                if (!/^\d+(\.\d{1,2})?$/.test(v)) return 'Max 2 decimal places'
                return true
              },
            }}
            render={({ field, fieldState }) => (
              <AmountInput
                id="expense-amount"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                name={field.name}
              />
            )}
          />

          {/* Category */}
          <Controller
            name="category"
            control={control}
            rules={{ required: 'Category is required' }}
            render={({ field, fieldState }) => (
              <CategoryPicker
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />

          {/* Date */}
          <Controller
            name="spent_on"
            control={control}
            rules={{ required: 'Date is required' }}
            render={({ field, fieldState }) => (
              <DateInput
                id="expense-date"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                name={field.name}
              />
            )}
          />

          {/* Note */}
          <Controller
            name="note"
            control={control}
            render={({ field, fieldState }) => (
              <NoteInput
                id="expense-note"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                name={field.name}
              />
            )}
          />

          {/* Server error */}
          {serverError && (
            <p
              className="text-sm text-oxblood font-sans"
              role="alert"
              data-testid="form-server-error"
            >
              {serverError}
            </p>
          )}
        </DialogBody>

        <DialogFooter>
          {/* Cancel */}
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            data-testid="form-cancel"
          >
            cancel
          </Button>

          {/* Submit */}
          <Button
            type="submit"
            disabled={!canSubmit}
            data-testid="form-submit"
          >
            {isSubmitting ? 'saving…' : submitLabel}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}

/**
 * ExpenseFormDialog — Add / Edit expense modal.
 * Mode=create: POST /api/expenses.
 * Mode=edit: PATCH /api/expenses/[id].
 * Shows field-level errors from 400 responses.
 * On success: close dialog, show toast, router.refresh().
 *
 * The inner form is remounted via key={String(open)} so state
 * resets cleanly each time the dialog opens — no useEffect needed.
 */
export function ExpenseFormDialog({
  open,
  onOpenChange,
  mode,
  initialValues,
}: ExpenseFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="sm:max-w-md"
        data-testid="expense-form-dialog"
      >
        {open && (
          <ExpenseFormInner
            key={`${mode}-${initialValues?.id ?? 'new'}-${String(open)}`}
            mode={mode}
            initialValues={initialValues}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
