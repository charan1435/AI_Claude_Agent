import * as React from 'react'
import { Label } from '@/components/ui/label'

interface DateInputProps {
  id: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
  error?: string
  name?: string
}

/**
 * DateInput — browser-native date input for MVP.
 * Defaults to today's date in the user's locale.
 */
export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  function DateInput({ id, value, onChange, onBlur, error, name }, ref) {
    return (
      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor={id}
          className="text-xs tracking-widest uppercase text-ink-muted font-sans font-medium"
        >
          Date
        </Label>
        <input
          ref={ref}
          id={id}
          name={name}
          type="date"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          aria-invalid={!!error}
          className="flex h-9 w-full rounded-sm border border-hairline bg-surface px-3 py-2 text-sm font-sans text-ink outline-none transition-shadow focus:ring-2 focus:ring-ochre focus:border-ochre disabled:cursor-not-allowed disabled:opacity-50"
          data-testid="date-input"
        />
        {error && (
          <p className="text-xs text-oxblood font-sans" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)
