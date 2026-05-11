import { createServerClient } from '@/lib/supabase/server'
import { expenseCreateSchema, expenseListQuerySchema } from '@/lib/validation/expense'

// ---------------------------------------------------------------------------
// POST /api/expenses — create an expense for the authenticated user
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  const supabase = await createServerClient()

  // 1. Auth check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return Response.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse and validate request body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ data: null, error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = expenseCreateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { data: null, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  // 3. Insert row (RLS enforces user_id = auth.uid())
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      user_id: user.id,
      amount: parsed.data.amount,
      category: parsed.data.category,
      spent_on: parsed.data.spent_on,
      note: parsed.data.note ?? null,
    })
    .select()
    .single()

  if (error) {
    return Response.json({ data: null, error: error.message }, { status: 500 })
  }

  return Response.json({ data, error: null }, { status: 201 })
}

// ---------------------------------------------------------------------------
// GET /api/expenses — list expenses for the authenticated user
// Query params: ?category=Food|Transport|Bills|Other &q=<text> &limit=<number>
// Sorted: spent_on desc, created_at desc
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
  const rawParams = {
    category: searchParams.get('category') ?? undefined,
    q: searchParams.get('q') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
  }

  const parsed = expenseListQuerySchema.safeParse(rawParams)
  if (!parsed.success) {
    return Response.json(
      { data: null, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { category, q, limit } = parsed.data

  // 3. Build query (RLS scopes to current user automatically)
  let query = supabase
    .from('expenses')
    .select('id, user_id, amount, category, spent_on, note, created_at, updated_at')
    .order('spent_on', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (category) {
    query = query.eq('category', category)
  }

  if (q) {
    query = query.ilike('note', `%${q}%`)
  }

  const { data, error } = await query

  if (error) {
    return Response.json({ data: null, error: error.message }, { status: 500 })
  }

  return Response.json({ data, error: null }, { status: 200 })
}
