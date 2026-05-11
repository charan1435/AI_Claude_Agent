'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SearchIcon } from 'lucide-react'

/**
 * ExpenseSearch — debounced (250ms) text search.
 * Updates URL ?q= param which triggers server component re-render.
 * Thin underlined input (editorial feel — no box, just bottom hairline).
 */
export function ExpenseSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = React.useState(searchParams.get('q') ?? '')
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value
    setValue(newValue)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (newValue.trim()) {
        params.set('q', newValue.trim())
      } else {
        params.delete('q')
      }
      router.push(`/?${params.toString()}`)
    }, 250)
  }

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return (
    <div className="relative flex items-center" data-testid="expense-search">
      <SearchIcon className="absolute left-0 size-3.5 text-ink-muted pointer-events-none" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={handleChange}
        placeholder="search notes…"
        aria-label="Search expenses by note"
        className="w-full pl-5 pr-0 py-1.5 bg-transparent border-b border-hairline text-sm font-sans text-ink placeholder:text-ink-muted/60 outline-none focus:border-ink-muted transition-colors"
        data-testid="search-input"
      />
    </div>
  )
}
