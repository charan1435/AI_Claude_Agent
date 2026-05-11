import { z } from 'zod'

// ---------------------------------------------------------------------------
// Shared constants
// ---------------------------------------------------------------------------

export const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Bills', 'Other'] as const
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

// ---------------------------------------------------------------------------
// Create schema
// Zod v4 API: use `error` instead of `required_error`/`invalid_type_error`
// ---------------------------------------------------------------------------

export const expenseCreateSchema = z.object({
  amount: z
    .number({ error: 'amount must be a positive number' })
    .positive({ error: 'amount must be greater than 0' })
    .multipleOf(0.01, { error: 'amount must have at most 2 decimal places' }),

  category: z.enum(EXPENSE_CATEGORIES, {
    error: `category must be one of: ${EXPENSE_CATEGORIES.join(', ')}`,
  }),

  // Stored as a plain date column; accept YYYY-MM-DD strings
  spent_on: z
    .string({ error: 'spent_on must be a string' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, { error: 'spent_on must be a date in YYYY-MM-DD format' }),

  note: z
    .string()
    .max(500, { error: 'note must be at most 500 characters' })
    .nullable()
    .optional(),
})

export type ExpenseCreateInput = z.infer<typeof expenseCreateSchema>

// ---------------------------------------------------------------------------
// Update schema (all fields optional, but at least one must be present)
// ---------------------------------------------------------------------------

export const expenseUpdateSchema = expenseCreateSchema
  .partial()
  .refine(
    (data) => Object.keys(data).some((k) => data[k as keyof typeof data] !== undefined),
    { error: 'At least one field must be provided for update' }
  )

export type ExpenseUpdateInput = z.infer<typeof expenseUpdateSchema>

// ---------------------------------------------------------------------------
// Query-param schemas (for GET /api/expenses)
// ---------------------------------------------------------------------------

export const expenseListQuerySchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES).optional(),
  q: z.string().max(200).optional(),
  limit: z
    .string()
    .optional()
    .transform((v) => (v !== undefined ? parseInt(v, 10) : 100))
    .pipe(z.number().int().positive().max(500)),
})

export type ExpenseListQuery = z.infer<typeof expenseListQuerySchema>

// ---------------------------------------------------------------------------
// Summary query-param schema (for GET /api/expenses/summary)
// ---------------------------------------------------------------------------

export const summaryQuerySchema = z.object({
  tz: z.string().optional().default('UTC'),
})

export type SummaryQuery = z.infer<typeof summaryQuerySchema>
