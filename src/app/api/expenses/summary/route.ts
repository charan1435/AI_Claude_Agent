import { createServerClient } from '@/lib/supabase/server'
import { summaryQuerySchema, EXPENSE_CATEGORIES, type ExpenseCategory } from '@/lib/validation/expense'

// ---------------------------------------------------------------------------
// GET /api/expenses/summary — monthly totals for the current month
//
// Query params:
//   ?tz=<IANA timezone>   e.g. ?tz=America/New_York
//                         Falls back to UTC if missing or invalid.
//
// Response:
//   { data: { month: 'YYYY-MM', total: number, byCategory: { Food: number, ... } }, error: null }
// ---------------------------------------------------------------------------
export async function GET(request: Request) {
  const supabase = await createServerClient()

  // 1. Auth check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return Response.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse query params
  const { searchParams } = new URL(request.url)
  const parsed = summaryQuerySchema.safeParse({ tz: searchParams.get('tz') ?? undefined })

  if (!parsed.success) {
    return Response.json(
      { data: null, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  // 3. Resolve timezone and compute current-month boundaries as YYYY-MM-DD strings
  let timezone = parsed.data.tz
  let monthStart: string
  let monthEnd: string
  let monthLabel: string

  try {
    // Validate the IANA timezone by using it in a Intl.DateTimeFormat call
    const now = new Date()
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    // en-CA locale gives YYYY-MM-DD format
    const localDateStr = formatter.format(now) // e.g. "2026-05-11"
    const [year, month] = localDateStr.split('-').map(Number)
    monthLabel = `${year}-${String(month).padStart(2, '0')}`
    monthStart = `${year}-${String(month).padStart(2, '0')}-01`
    // Last day of month: day 0 of next month = last day of current month
    const lastDay = new Date(year, month, 0).getDate()
    monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  } catch {
    // Invalid timezone — fall back to UTC
    timezone = 'UTC'
    const now = new Date()
    const year = now.getUTCFullYear()
    const month = now.getUTCMonth() + 1
    monthLabel = `${year}-${String(month).padStart(2, '0')}`
    monthStart = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
    monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  }

  // 4. Fetch all expenses in the current month (RLS scopes to current user)
  const { data: rows, error } = await supabase
    .from('expenses')
    .select('amount, category')
    .gte('spent_on', monthStart)
    .lte('spent_on', monthEnd)

  if (error) {
    return Response.json({ data: null, error: error.message }, { status: 500 })
  }

  // 5. Aggregate totals
  const byCategory: Record<ExpenseCategory, number> = {
    Food: 0,
    Transport: 0,
    Bills: 0,
    Other: 0,
  }
  let total = 0

  for (const row of rows ?? []) {
    const amount = Number(row.amount)
    total += amount
    const cat = row.category as ExpenseCategory
    if (EXPENSE_CATEGORIES.includes(cat)) {
      byCategory[cat] += amount
    }
  }

  // Round to 2 decimal places to avoid floating-point artefacts
  total = Math.round(total * 100) / 100
  for (const cat of EXPENSE_CATEGORIES) {
    byCategory[cat] = Math.round(byCategory[cat] * 100) / 100
  }

  return Response.json(
    {
      data: {
        month: monthLabel,
        total,
        byCategory,
      },
      error: null,
    },
    { status: 200 }
  )
}
