import { createServerClient } from '@/lib/supabase/server'
import { summaryQuerySchema } from '@/lib/validation/expense'
import {
  aggregateMonthlyTotals,
  getCurrentMonthBoundaries,
} from '@/lib/expense-aggregation'

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

  // 3. Resolve current-month boundaries in the caller's timezone (falls back to UTC)
  const { monthLabel, monthStart, monthEndInclusive } = getCurrentMonthBoundaries(
    parsed.data.tz ?? 'UTC'
  )

  // 4. Fetch all expenses in the current month (RLS scopes to current user)
  const { data: rows, error } = await supabase
    .from('expenses')
    .select('amount, category')
    .gte('spent_on', monthStart)
    .lte('spent_on', monthEndInclusive)

  if (error) {
    return Response.json({ data: null, error: error.message }, { status: 500 })
  }

  // 5. Aggregate totals (rounded to 2 decimal places inside the helper)
  const { total, byCategory } = aggregateMonthlyTotals(rows ?? [])

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
