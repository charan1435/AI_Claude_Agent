import * as React from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface NoteInputProps {
  id: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void
  error?: string
  name?: string
}

/**
 * NoteInput — optional short note / description textarea.
 */
export const NoteInput = React.forwardRef<HTMLTextAreaElement, NoteInputProps>(
  function NoteInput({ id, value, onChange, onBlur, error, name }, ref) {
    return (
      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor={id}
          className="text-xs tracking-widest uppercase text-ink-muted font-sans font-medium"
        >
          Note{' '}
          <span className="normal-case tracking-normal text-ink-muted/70">(optional)</span>
        </Label>
        <Textarea
          ref={ref}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder="coffee + bagel, uber home…"
          maxLength={500}
          rows={3}
          aria-invalid={!!error}
          className="rounded-sm border-hairline bg-surface font-sans text-ink placeholder:text-ink-muted/60 resize-none focus-visible:ring-ochre focus-visible:border-ochre"
          data-testid="note-input"
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
