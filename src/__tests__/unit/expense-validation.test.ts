/**
 * PROJ-11: Unit tests for Zod validation schemas
 *
 * Exhaustive coverage of:
 *   - expenseCreateSchema
 *   - expenseUpdateSchema
 *   - expenseListQuerySchema
 *   - summaryQuerySchema
 *
 * All schemas live in src/lib/validation/expense.ts.
 * Uses Zod v4 (4.4.3) — parse/safeParse API is identical to v3.
 */

import {
  expenseCreateSchema,
  expenseUpdateSchema,
  expenseListQuerySchema,
  summaryQuerySchema,
  EXPENSE_CATEGORIES,
} from '@/lib/validation/expense'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Assert that a safeParse result is successful and return the data. */
function expectSuccess<T>(result: { success: boolean; data?: T; error?: unknown }): T {
  expect(result.success).toBe(true)
  return result.data as T
}

/** Assert that a safeParse result failed and return the error. */
function expectFailure(result: { success: boolean; error?: unknown }) {
  expect(result.success).toBe(false)
  return result.error
}

// ---------------------------------------------------------------------------
// expenseCreateSchema
// ---------------------------------------------------------------------------

describe('expenseCreateSchema', () => {
  const baseValid = {
    amount: 12.5,
    category: 'Food' as const,
    spent_on: '2026-05-11',
    note: 'Lunch',
  }

  describe('valid inputs', () => {
    it('accepts a complete valid payload', () => {
      const data = expectSuccess(expenseCreateSchema.safeParse(baseValid))
      expect(data.amount).toBe(12.5)
      expect(data.category).toBe('Food')
      expect(data.spent_on).toBe('2026-05-11')
      expect(data.note).toBe('Lunch')
    })

    it('accepts all four category values', () => {
      for (const cat of EXPENSE_CATEGORIES) {
        const data = expectSuccess(
          expenseCreateSchema.safeParse({ ...baseValid, category: cat })
        )
        expect(data.category).toBe(cat)
      }
    })

    it('accepts note as null', () => {
      const data = expectSuccess(
        expenseCreateSchema.safeParse({ ...baseValid, note: null })
      )
      expect(data.note).toBeNull()
    })

    it('accepts note omitted entirely (optional field)', () => {
      const { note: _omitted, ...withoutNote } = baseValid
      const data = expectSuccess(expenseCreateSchema.safeParse(withoutNote))
      expect(data.note).toBeUndefined()
    })

    it('accepts amount with exactly 2 decimal places', () => {
      const data = expectSuccess(
        expenseCreateSchema.safeParse({ ...baseValid, amount: 99.99 })
      )
      expect(data.amount).toBe(99.99)
    })

    it('accepts amount with 1 decimal place', () => {
      const data = expectSuccess(
        expenseCreateSchema.safeParse({ ...baseValid, amount: 5.5 })
      )
      expect(data.amount).toBe(5.5)
    })

    it('accepts a whole number amount', () => {
      const data = expectSuccess(
        expenseCreateSchema.safeParse({ ...baseValid, amount: 100 })
      )
      expect(data.amount).toBe(100)
    })

    it('accepts note with exactly 500 characters', () => {
      const note = 'a'.repeat(500)
      const data = expectSuccess(expenseCreateSchema.safeParse({ ...baseValid, note }))
      expect(data.note).toHaveLength(500)
    })

    it('accepts spent_on with different valid dates', () => {
      for (const date of ['2024-01-01', '2026-12-31', '2000-06-15']) {
        expectSuccess(expenseCreateSchema.safeParse({ ...baseValid, spent_on: date }))
      }
    })
  })

  describe('amount validation', () => {
    it('rejects amount of 0', () => {
      expectFailure(expenseCreateSchema.safeParse({ ...baseValid, amount: 0 }))
    })

    it('rejects negative amount', () => {
      expectFailure(expenseCreateSchema.safeParse({ ...baseValid, amount: -5.0 }))
    })

    it('rejects amount with 3 decimal places', () => {
      expectFailure(expenseCreateSchema.safeParse({ ...baseValid, amount: 12.555 }))
    })

    it('rejects amount with 4 decimal places', () => {
      expectFailure(expenseCreateSchema.safeParse({ ...baseValid, amount: 1.1234 }))
    })

    it('rejects missing amount', () => {
      const { amount: _omitted, ...body } = baseValid
      expectFailure(expenseCreateSchema.safeParse(body))
    })

    it('rejects string amount', () => {
      expectFailure(expenseCreateSchema.safeParse({ ...baseValid, amount: '12.50' }))
    })

    it('rejects null amount', () => {
      expectFailure(expenseCreateSchema.safeParse({ ...baseValid, amount: null }))
    })
  })

  describe('category validation', () => {
    it('rejects missing category', () => {
      const { category: _omitted, ...body } = baseValid
      expectFailure(expenseCreateSchema.safeParse(body))
    })

    it('rejects invalid category enum value', () => {
      expectFailure(
        expenseCreateSchema.safeParse({ ...baseValid, category: 'Groceries' })
      )
    })

    it('rejects lowercase category value', () => {
      expectFailure(
        expenseCreateSchema.safeParse({ ...baseValid, category: 'food' })
      )
    })

    it('rejects empty string category', () => {
      expectFailure(
        expenseCreateSchema.safeParse({ ...baseValid, category: '' })
      )
    })
  })

  describe('spent_on validation', () => {
    it('rejects missing spent_on', () => {
      const { spent_on: _omitted, ...body } = baseValid
      expectFailure(expenseCreateSchema.safeParse(body))
    })

    it('rejects malformed date: MM/DD/YYYY format', () => {
      expectFailure(
        expenseCreateSchema.safeParse({ ...baseValid, spent_on: '05/11/2026' })
      )
    })

    it('rejects malformed date: YYYY/MM/DD format', () => {
      expectFailure(
        expenseCreateSchema.safeParse({ ...baseValid, spent_on: '2026/05/11' })
      )
    })

    it('rejects malformed date: partial string', () => {
      expectFailure(
        expenseCreateSchema.safeParse({ ...baseValid, spent_on: '2026-05' })
      )
    })

    it('rejects empty string for spent_on', () => {
      expectFailure(
        expenseCreateSchema.safeParse({ ...baseValid, spent_on: '' })
      )
    })

    it('rejects null spent_on', () => {
      expectFailure(
        expenseCreateSchema.safeParse({ ...baseValid, spent_on: null })
      )
    })

    it('rejects numeric spent_on', () => {
      expectFailure(
        expenseCreateSchema.safeParse({ ...baseValid, spent_on: 20260511 })
      )
    })
  })

  describe('note validation', () => {
    it('rejects note longer than 500 characters', () => {
      const note = 'a'.repeat(501)
      expectFailure(expenseCreateSchema.safeParse({ ...baseValid, note }))
    })

    it('rejects note of exactly 501 characters', () => {
      expectFailure(
        expenseCreateSchema.safeParse({ ...baseValid, note: 'b'.repeat(501) })
      )
    })

    it('accepts empty string note', () => {
      expectSuccess(expenseCreateSchema.safeParse({ ...baseValid, note: '' }))
    })
  })
})

// ---------------------------------------------------------------------------
// expenseUpdateSchema
// ---------------------------------------------------------------------------

describe('expenseUpdateSchema', () => {
  it('rejects an empty object (at least one field required)', () => {
    expectFailure(expenseUpdateSchema.safeParse({}))
  })

  it('accepts update with only amount', () => {
    const data = expectSuccess(expenseUpdateSchema.safeParse({ amount: 15.0 }))
    expect(data.amount).toBe(15.0)
  })

  it('accepts update with only category', () => {
    const data = expectSuccess(expenseUpdateSchema.safeParse({ category: 'Transport' }))
    expect(data.category).toBe('Transport')
  })

  it('accepts update with only spent_on', () => {
    const data = expectSuccess(
      expenseUpdateSchema.safeParse({ spent_on: '2026-04-01' })
    )
    expect(data.spent_on).toBe('2026-04-01')
  })

  it('accepts update with only note (including null to clear)', () => {
    const data = expectSuccess(expenseUpdateSchema.safeParse({ note: null }))
    expect(data.note).toBeNull()
  })

  it('accepts a valid partial update with multiple fields', () => {
    const data = expectSuccess(
      expenseUpdateSchema.safeParse({ amount: 20.0, category: 'Bills' })
    )
    expect(data.amount).toBe(20.0)
    expect(data.category).toBe('Bills')
  })

  it('accepts a full update (all fields present)', () => {
    const data = expectSuccess(
      expenseUpdateSchema.safeParse({
        amount: 50.0,
        category: 'Other',
        spent_on: '2026-03-15',
        note: 'Updated note',
      })
    )
    expect(data.amount).toBe(50.0)
    expect(data.category).toBe('Other')
    expect(data.spent_on).toBe('2026-03-15')
    expect(data.note).toBe('Updated note')
  })

  it('rejects update where amount is 0', () => {
    expectFailure(expenseUpdateSchema.safeParse({ amount: 0 }))
  })

  it('rejects update where amount is negative', () => {
    expectFailure(expenseUpdateSchema.safeParse({ amount: -1 }))
  })

  it('rejects update where amount has too many decimal places', () => {
    expectFailure(expenseUpdateSchema.safeParse({ amount: 1.234 }))
  })

  it('rejects update with invalid category enum', () => {
    expectFailure(expenseUpdateSchema.safeParse({ category: 'Entertainment' }))
  })

  it('rejects update with malformed spent_on', () => {
    expectFailure(expenseUpdateSchema.safeParse({ spent_on: 'May 11 2026' }))
  })

  it('rejects update where note exceeds 500 chars', () => {
    expectFailure(expenseUpdateSchema.safeParse({ note: 'x'.repeat(501) }))
  })

  it('treats a payload with all-undefined values as an empty update (should fail)', () => {
    // All fields explicitly undefined — the refine should catch this
    expectFailure(
      expenseUpdateSchema.safeParse({
        amount: undefined,
        category: undefined,
        spent_on: undefined,
        note: undefined,
      })
    )
  })
})

// ---------------------------------------------------------------------------
// expenseListQuerySchema
// ---------------------------------------------------------------------------

describe('expenseListQuerySchema', () => {
  it('accepts empty query params and defaults limit to 100', () => {
    const data = expectSuccess(expenseListQuerySchema.safeParse({}))
    expect(data.limit).toBe(100)
    expect(data.category).toBeUndefined()
    expect(data.q).toBeUndefined()
  })

  it('accepts a valid category filter', () => {
    for (const cat of EXPENSE_CATEGORIES) {
      const data = expectSuccess(
        expenseListQuerySchema.safeParse({ category: cat })
      )
      expect(data.category).toBe(cat)
    }
  })

  it('rejects an invalid category enum value', () => {
    expectFailure(
      expenseListQuerySchema.safeParse({ category: 'InvalidCat' })
    )
  })

  it('rejects lowercase category filter', () => {
    expectFailure(expenseListQuerySchema.safeParse({ category: 'food' }))
  })

  it('accepts a valid limit string and parses it to integer', () => {
    const data = expectSuccess(expenseListQuerySchema.safeParse({ limit: '50' }))
    expect(data.limit).toBe(50)
  })

  it('accepts limit at the max boundary: 500', () => {
    const data = expectSuccess(expenseListQuerySchema.safeParse({ limit: '500' }))
    expect(data.limit).toBe(500)
  })

  it('accepts limit at the min boundary: 1', () => {
    const data = expectSuccess(expenseListQuerySchema.safeParse({ limit: '1' }))
    expect(data.limit).toBe(1)
  })

  it('rejects limit of 0 (out of range)', () => {
    expectFailure(expenseListQuerySchema.safeParse({ limit: '0' }))
  })

  it('rejects limit of 501 (exceeds max)', () => {
    expectFailure(expenseListQuerySchema.safeParse({ limit: '501' }))
  })

  it('rejects negative limit', () => {
    expectFailure(expenseListQuerySchema.safeParse({ limit: '-1' }))
  })

  it('accepts a search query string', () => {
    const data = expectSuccess(expenseListQuerySchema.safeParse({ q: 'Lunch' }))
    expect(data.q).toBe('Lunch')
  })

  it('accepts combined valid params', () => {
    const data = expectSuccess(
      expenseListQuerySchema.safeParse({ category: 'Food', q: 'coffee', limit: '25' })
    )
    expect(data.category).toBe('Food')
    expect(data.q).toBe('coffee')
    expect(data.limit).toBe(25)
  })

  it('defaults limit to 100 when omitted', () => {
    const data = expectSuccess(expenseListQuerySchema.safeParse({ category: 'Bills' }))
    expect(data.limit).toBe(100)
  })
})

// ---------------------------------------------------------------------------
// summaryQuerySchema
// ---------------------------------------------------------------------------

describe('summaryQuerySchema', () => {
  it('defaults tz to UTC when omitted', () => {
    const data = expectSuccess(summaryQuerySchema.safeParse({}))
    expect(data.tz).toBe('UTC')
  })

  it('accepts a valid IANA timezone string', () => {
    const data = expectSuccess(
      summaryQuerySchema.safeParse({ tz: 'America/New_York' })
    )
    expect(data.tz).toBe('America/New_York')
  })

  it('accepts other valid IANA timezone strings', () => {
    const validTimezones = [
      'Europe/London',
      'Asia/Tokyo',
      'Australia/Sydney',
      'America/Los_Angeles',
      'UTC',
    ]
    for (const tz of validTimezones) {
      const data = expectSuccess(summaryQuerySchema.safeParse({ tz }))
      expect(data.tz).toBe(tz)
    }
  })

  it('accepts an empty tz string (server will fall back to UTC at runtime)', () => {
    // The schema itself is just z.string().optional() — it doesn't validate IANA format.
    // Invalid timezone validation happens at runtime inside the route handler.
    const data = expectSuccess(summaryQuerySchema.safeParse({ tz: '' }))
    expect(data.tz).toBe('')
  })

  it('accepts an invalid tz string (schema does not enforce IANA — server falls back)', () => {
    // Schema accepts any string; IANA validation is done in the route handler
    const data = expectSuccess(summaryQuerySchema.safeParse({ tz: 'Not/A/Valid/TZ' }))
    expect(data.tz).toBe('Not/A/Valid/TZ')
  })

  it('accepts tz as undefined and uses the default', () => {
    const data = expectSuccess(summaryQuerySchema.safeParse({ tz: undefined }))
    expect(data.tz).toBe('UTC')
  })
})

// ---------------------------------------------------------------------------
// EXPENSE_CATEGORIES constant
// ---------------------------------------------------------------------------

describe('EXPENSE_CATEGORIES', () => {
  it('contains exactly the four expected categories', () => {
    expect(EXPENSE_CATEGORIES).toEqual(['Food', 'Transport', 'Bills', 'Other'])
  })

  it('is a readonly tuple (TypeScript compile-time, checked at length)', () => {
    expect(EXPENSE_CATEGORIES).toHaveLength(4)
  })
})
