/**
 * PROJ-14: RLS isolation test — user A cannot read/write user B's rows
 *
 * This is the critical security test.
 *
 * Environment required:
 *   SUPABASE_TEST_URL    — Supabase project URL (local emulator or test project)
 *   SUPABASE_TEST_ANON_KEY — Supabase anon key
 *
 * When these env vars are absent the entire suite is skipped cleanly.
 *
 * IMPORTANT: Uses ONLY the anon key (user-scoped client).
 * NEVER uses the service-role key — that would bypass RLS.
 *
 * Setup: Two separate Supabase clients, each authenticated as a distinct user.
 * The test uses random emails so it does not depend on pre-seeded data.
 *
 * Run: npm run test:ci -- --testPathPattern=rls-isolation
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Environment check — skip entire suite when env is absent
// ---------------------------------------------------------------------------

const SUPABASE_TEST_URL = process.env.SUPABASE_TEST_URL
const SUPABASE_TEST_ANON_KEY = process.env.SUPABASE_TEST_ANON_KEY

const envPresent = !!(SUPABASE_TEST_URL && SUPABASE_TEST_ANON_KEY)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomEmail(): string {
  return `rls_test_${Date.now()}_${Math.random().toString(36).slice(2, 10)}@example.com`
}

const TEST_PASSWORD = 'RLStestPass123!'

/** Sign up a new user and return a signed-in supabase client. */
async function createSignedInClient(email: string, password: string): Promise<SupabaseClient> {
  if (!SUPABASE_TEST_URL || !SUPABASE_TEST_ANON_KEY) {
    throw new Error('SUPABASE_TEST_URL and SUPABASE_TEST_ANON_KEY must be set')
  }

  const client = createClient(SUPABASE_TEST_URL, SUPABASE_TEST_ANON_KEY)

  // Sign up (local Supabase auto-confirms by default)
  const { error: signUpError } = await client.auth.signUp({ email, password })
  if (signUpError) {
    throw new Error(`signUp failed for ${email}: ${signUpError.message}`)
  }

  // Sign in to get a valid session
  const { data, error: signInError } = await client.auth.signInWithPassword({
    email,
    password,
  })
  if (signInError || !data.session) {
    throw new Error(`signIn failed for ${email}: ${signInError?.message ?? 'no session'}`)
  }

  return client
}

/** Insert an expense row for the currently signed-in user. */
async function insertExpense(
  client: SupabaseClient,
  userId: string
): Promise<string> {
  const { data, error } = await client
    .from('expenses')
    .insert({
      user_id: userId,
      amount: 42.5,
      category: 'Food',
      spent_on: '2026-05-11',
      note: 'RLS test expense',
    })
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(`Insert failed: ${error?.message}`)
  }

  return data.id as string
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RLS isolation — user A cannot access user B data', () => {
  if (!envPresent) {
    it.skip('SUPABASE_TEST_URL not set — skipping RLS tests', () => {})
    return
  }

  let clientA: SupabaseClient
  let clientB: SupabaseClient
  let userAId: string
  let userBId: string
  let expenseIdA: string

  const emailA = randomEmail()
  const emailB = randomEmail()

  beforeAll(async () => {
    // Create two distinct signed-in clients
    clientA = await createSignedInClient(emailA, TEST_PASSWORD)
    clientB = await createSignedInClient(emailB, TEST_PASSWORD)

    // Get user IDs
    const { data: dataA } = await clientA.auth.getUser()
    const { data: dataB } = await clientB.auth.getUser()

    if (!dataA.user || !dataB.user) {
      throw new Error('Could not get user IDs')
    }

    userAId = dataA.user.id
    userBId = dataB.user.id

    // User A inserts an expense
    expenseIdA = await insertExpense(clientA, userAId)
  }, 30_000)

  afterAll(async () => {
    // Cleanup: delete both test users' data (best-effort)
    // Note: RLS allows delete only for own rows, so each client deletes its own data
    await clientA?.from('expenses').delete().eq('user_id', userAId)
    await clientA?.auth.signOut()
    await clientB?.auth.signOut()
  })

  // -------------------------------------------------------------------------
  // SELECT isolation
  // -------------------------------------------------------------------------

  it('User B sees zero rows when selecting all expenses (RLS scopes to own user_id)', async () => {
    const { data, error } = await clientB.from('expenses').select('*')

    expect(error).toBeNull()
    // data should be empty — user B has no expenses, and RLS hides user A's
    expect(data).toHaveLength(0)
  })

  it('User B cannot select user A\'s specific expense row by id', async () => {
    const { data, error } = await clientB
      .from('expenses')
      .select('*')
      .eq('id', expenseIdA)

    // RLS returns empty result, not a permission error
    expect(error).toBeNull()
    expect(data).toHaveLength(0)
  })

  // -------------------------------------------------------------------------
  // UPDATE isolation
  // -------------------------------------------------------------------------

  it('User B cannot update user A\'s expense row (RLS: UPDATE USING user_id = auth.uid())', async () => {
    const { data, error } = await clientB
      .from('expenses')
      .update({ note: 'Hacked by User B' })
      .eq('id', expenseIdA)
      .select()

    // Either an error or zero rows returned — both are acceptable RLS responses
    if (error) {
      // Supabase may return a PostgREST error code for the RLS violation
      expect(error).toBeDefined()
    } else {
      // More likely: no rows matched (RLS silently filtered out the row)
      expect(data).toHaveLength(0)
    }
  })

  it('User A\'s expense note is unchanged after User B\'s attempted update', async () => {
    // Re-fetch as User A to confirm the note was not modified
    const { data, error } = await clientA
      .from('expenses')
      .select('note')
      .eq('id', expenseIdA)
      .single()

    expect(error).toBeNull()
    expect(data?.note).toBe('RLS test expense')
  })

  // -------------------------------------------------------------------------
  // DELETE isolation
  // -------------------------------------------------------------------------

  it('User B cannot delete user A\'s expense row', async () => {
    const { data, error } = await clientB
      .from('expenses')
      .delete()
      .eq('id', expenseIdA)
      .select('id')

    if (error) {
      expect(error).toBeDefined()
    } else {
      // Zero rows affected — RLS silently blocked it
      expect(data).toHaveLength(0)
    }
  })

  it('User A\'s expense still exists after User B\'s attempted delete', async () => {
    const { data, error } = await clientA
      .from('expenses')
      .select('id')
      .eq('id', expenseIdA)

    expect(error).toBeNull()
    expect(data).toHaveLength(1)
    expect(data?.[0]?.id).toBe(expenseIdA)
  })

  // -------------------------------------------------------------------------
  // INSERT isolation — user B cannot insert a row with user A's user_id
  // -------------------------------------------------------------------------

  it('User B cannot insert an expense claiming user A\'s user_id (INSERT WITH CHECK)', async () => {
    const { error } = await clientB
      .from('expenses')
      .insert({
        user_id: userAId, // deliberately claim user A's ID
        amount: 99.99,
        category: 'Other',
        spent_on: '2026-05-11',
        note: 'Forged expense',
      })

    // The INSERT WITH CHECK constraint ensures auth.uid() = user_id
    // Supabase should return an error or insert with the correct user_id (and then be invisible)
    expect(error).not.toBeNull()
  })

  // -------------------------------------------------------------------------
  // Own data — confirm User A can still see their own data
  // -------------------------------------------------------------------------

  it('User A can select their own expenses', async () => {
    const { data, error } = await clientA.from('expenses').select('*')
    expect(error).toBeNull()
    // User A should see at least the one expense they created
    expect(data!.length).toBeGreaterThanOrEqual(1)
    const ids = data!.map((r) => r.id)
    expect(ids).toContain(expenseIdA)
  })

  it('User B can insert their own expense (sanity check that RLS allows correct inserts)', async () => {
    const { data, error } = await clientB
      .from('expenses')
      .insert({
        user_id: userBId,
        amount: 15.0,
        category: 'Transport',
        spent_on: '2026-05-11',
        note: 'User B own expense',
      })
      .select('id')
      .single()

    expect(error).toBeNull()
    expect(data?.id).toBeDefined()

    // Cleanup
    if (data?.id) {
      await clientB.from('expenses').delete().eq('id', data.id)
    }
  })
})
