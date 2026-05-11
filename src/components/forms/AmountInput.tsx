import * as React from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface AmountInputProps {
  id: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
  error?: string
  name?: string
}

/**
 * AmountInput — currency-prefixed number input in IBM Plex Mono.
 * Shows $ prefix, uses tabular-nums for alignment.
 */
export const AmountInput = React.forwardRef<HTMLInputElement, AmountInputProps>(
  function AmountInput({ id, value, onChange, onBlur, error, name }, ref) {
    return (
      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor={id}
          className="text-xs tracking-widest uppercase text-ink-muted font-sans font-medium"
        >
          Amount
        </Label>
        <div className="flex items-center border border-hairline rounded-sm bg-surface focus-within:ring-2 focus-within:ring-ochre focus-within:border-ochre transition-shadow">
          <span className="pl-3 pr-1 font-mono text-sm text-ink-muted select-none" aria-hidden="true">
            $
          </span>
          <input
            ref={ref}
            id={id}
            name={name}
            type="number"
            min="0.01"
            step="0.01"
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            placeholder="0.00"
            aria-invalid={!!error}
            className={cn(
              'flex-1 bg-transparent py-2 pr-3 font-mono text-sm text-ink tabular-nums outline-none placeholder:text-ink-muted/60',
              '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
            )}
            data-testid="amount-input"
          />
        </div>
        {error && (
          <p className="text-xs text-oxblood font-sans" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)
