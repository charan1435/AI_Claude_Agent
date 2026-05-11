import { createServerClient } from '@/lib/supabase/server'

// ---------------------------------------------------------------------------
// POST /api/auth/signout — clear the Supabase session and return 204
// ---------------------------------------------------------------------------
export async function POST() {
  const supabase = await createServerClient()

  // getUser() before signOut to ensure the client has a valid session reference
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    await supabase.auth.signOut()
  }

  // Return 204 No Content — session cookies are cleared by signOut()
  return new Response(null, { status: 204 })
}
