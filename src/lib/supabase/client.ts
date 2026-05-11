import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a browser-side Supabase client.
 *
 * Use this ONLY in Client Components ('use client').
 * Never use this in Route Handlers or Server Components — use
 * src/lib/supabase/server.ts instead so RLS sees auth.uid().
 *
 * The anon key is intentionally public (NEXT_PUBLIC_). The service-role
 * key is never used in this application — RLS enforces all authorization.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
