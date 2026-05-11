import { createServerClient } from '@/lib/supabase/server'
import { expenseUpdateSchema } from '@/lib/validation/expense'

interface RouteContext {
  params: Promise<{ id: string }>
}

// ---------------------------------------------------------------------------
// PATCH /api/expenses/[id] — update one expense (ownership enforced by RLS)
// ---------------------------------------------------------------------------
export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params
  const supabase = await createServerClient()

  // 1. Auth check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return Response.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Validate id format (basic UUID check)
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return Response.json({ data: null, error: 'Invalid expense id' }, { status: 400 })
  }

  // 3. Parse and validate request body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ data: null, error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = expenseUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { data: null, error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  // 4. Build update payload (only include provided fields)
  const updatePayload: Record<string, unknown> = {}
  if (parsed.data.amount !== undefined) updatePayload.amount = parsed.data.amount
  if (parsed.data.category !== undefined) updatePayload.category = parsed.data.category
  if (parsed.data.spent_on !== undefined) updatePayload.spent_on = parsed.data.spent_on
  if ('note' in parsed.data) updatePayload.note = parsed.data.note ?? null

  // 5. Update (RLS: only matches if user_id = auth.uid())
  const { data, error } = await supabase
    .from('expenses')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    // PGRST116 = no rows matched — row doesn't exist or belongs to another user
    if (error.code === 'PGRST116') {
      return Response.json({ data: null, error: 'Expense not found' }, { status: 404 })
    }
    return Response.json({ data: null, error: error.message }, { status: 500 })
  }

  if (!data) {
    return Response.json({ data: null, error: 'Expense not found' }, { status: 404 })
  }

  return Response.json({ data, error: null }, { status: 200 })
}

// ---------------------------------------------------------------------------
// DELETE /api/expenses/[id] — delete one expense (ownership enforced by RLS)
// ---------------------------------------------------------------------------
export async function DELETE(request: Request, { params }: RouteContext) {
  const { id } = await params
  const supabase = await createServerClient()

  // 1. Auth check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return Response.json({ data: null, error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Validate id format
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return Response.json({ data: null, error: 'Invalid expense id' }, { status: 400 })
  }

  // 3. Delete (RLS: only matches if user_id = auth.uid())
  const { data, error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id)
    .select('id')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return Response.json({ data: null, error: 'Expense not found' }, { status: 404 })
    }
    return Response.json({ data: null, error: error.message }, { status: 500 })
  }

  if (!data) {
    return Response.json({ data: null, error: 'Expense not found' }, { status: 404 })
  }

  return Response.json({ data: { id: data.id }, error: null }, { status: 200 })
}
