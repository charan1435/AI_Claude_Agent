import * as React from 'react'
import { EXPENSE_CATEGORIES, type ExpenseCategory } from '@/lib/validation/expense'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface CategoryPickerProps {
  value: ExpenseCategory
  onChange: (category: ExpenseCategory) => void
  error?: string
}

/**
 * CategoryPicker — segmented pill group for category selection.
 * Exactly one selected at a time. Selected pill: ink bg, paper text, hairline border.
 * Unselected pill: transparent bg, muted text, hairline border.
 */
export function CategoryPicker({ value, onChange, error }: CategoryPickerProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs tracking-widest uppercase text-ink-muted font-sans font-medium">
        Category
      </Label>
      <div
        className="flex flex-wrap gap-2"
        role="radiogroup"
        aria-label="Expense category"
        data-testid="category-picker"
      >
        {EXPENSE_CATEGORIES.map((cat) => {
          const isSelected = value === cat
          return (
            <button
              key={cat}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(cat)}
              className={cn(
                'px-3 py-1.5 text-xs font-sans tracking-wide uppercase rounded-sm border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre',
                isSelected
                  ? 'bg-ink text-paper border-ink'
                  : 'bg-transparent text-ink-muted border-hairline hover:border-ink-muted hover:text-ink'
              )}
              data-testid={`category-${cat.toLowerCase()}`}
            >
              {cat.toLowerCase()}
            </button>
          )
        })}
      </div>
      {error && (
        <p className="text-xs text-oxblood font-sans" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
