import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a cookie-bound Supabase server client.
 *
 * Use this in:
 *   - Next.js Route Handlers (API routes)
 *   - Server Components
 *
 * This client inherits the user's session from the request cookie, so
 * RLS policies see the correct auth.uid(). Never use the service-role
 * key in any Route Handler — RLS does the authorization.
 */
export async function createServerClient() {
  const cookieStore = await cookies()

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // setAll is called from Server Components where cookies cannot be
            // mutated. The middleware handles session refresh instead.
          }
        },
      },
    }
  )
}
