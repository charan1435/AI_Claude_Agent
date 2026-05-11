import { Suspense } from 'react'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/layout/AppHeader'
import { MonthlyTotal } from '@/components/dashboard/MonthlyTotal'
import { CategoryBreakdown } from '@/components/dashboard/CategoryBreakdown'
import { ExpenseListSection } from '@/components/expenses/ExpenseListSection'
import type { Expense } from '@/types/expense'
import type { ExpenseCategory } from '@/lib/validation/expense'

interface DashboardSearchParams {
  category?: string
  q?: string
}

/**
 * Dashboard — server component.
 * Fetches summary + expense list server-side using the cookie-bound Supabase client.
 * Reads ?category= and ?q= from searchParams.
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<DashboardSearchParams>
}) {
  const supabase = await createServerClient()

  // Verify auth (middleware handles redirect, but belt-and-suspenders)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const params = await searchParams
  const categoryFilter = params.category as ExpenseCategory | undefined
  const searchQuery = params.q

  // ── Fetch summary ──────────────────────────────────────────────────
  // Call the Supabase client directly from the server component
  // rather than going through the API route (avoids cookie forwarding complexity).
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth() + 1
  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const monthEnd = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

  // Fetch monthly summary via direct Supabase query
  const { data: monthlyExpenses } = await supabase
    .from('expenses')
    .select('amount, category')
    .gte('spent_on', monthStart)
    .lt('spent_on', monthEnd)

  const byCategory: Record<ExpenseCategory, number> = {
    Food: 0,
    Transport: 0,
    Bills: 0,
    Other: 0,
  }
  let monthTotal = 0

  for (const row of monthlyExpenses ?? []) {
    const cat = row.category as ExpenseCategory
    const amt = Number(row.amount)
    byCategory[cat] = (byCategory[cat] ?? 0) + amt
    monthTotal += amt
  }

  // ── Fetch expense list ──────────────────────────────────────────────
  let query = supabase
    .from('expenses')
    .select('*')
    .order('spent_on', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100)

  if (categoryFilter) {
    query = query.eq('category', categoryFilter)
  }

  if (searchQuery) {
    query = query.ilike('note', `%${searchQuery}%`)
  }

  const { data: expenses } = await query

  // ── Month label ─────────────────────────────────────────────────────
  const monthLabel = now.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })

  const hasActiveFilter = !!(categoryFilter || searchQuery)

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <AppHeader monthLabel={monthLabel} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        {/* ── Summary section ─────────────────────────────────────── */}
        <section aria-label="Monthly summary" className="mb-8">
          <MonthlyTotal total={monthTotal} />

          <div className="my-6 border-t border-hairline" />

          <Suspense
            fallback={
              <div className="grid grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <div className="h-3 w-16 bg-hairline rounded-sm animate-pulse" />
                    <div className="h-4 w-20 bg-hairline rounded-sm animate-pulse" />
                    <div className="h-1 bg-hairline rounded-sm animate-pulse" />
                  </div>
                ))}
              </div>
            }
          >
            <CategoryBreakdown byCategory={byCategory} total={monthTotal} />
          </Suspense>
        </section>

        {/* ── Expense list section ────────────────────────────────── */}
        <div className="border-t border-hairline mb-6" />

        <Suspense
          fallback={
            <div className="flex flex-col gap-0">
              <div className="py-3 border-b border-hairline flex gap-4">
                <div className="h-4 w-12 bg-hairline rounded-sm animate-pulse" />
                <div className="h-4 w-16 bg-hairline rounded-sm animate-pulse" />
                <div className="h-4 w-20 bg-hairline rounded-sm animate-pulse" />
                <div className="h-4 flex-1 bg-hairline rounded-sm animate-pulse" />
              </div>
              <div className="py-3 border-b border-hairline flex gap-4">
                <div className="h-4 w-12 bg-hairline rounded-sm animate-pulse" />
                <div className="h-4 w-16 bg-hairline rounded-sm animate-pulse" />
                <div className="h-4 w-20 bg-hairline rounded-sm animate-pulse" />
                <div className="h-4 flex-1 bg-hairline rounded-sm animate-pulse" />
              </div>
              <div className="py-3 border-b border-hairline flex gap-4">
                <div className="h-4 w-12 bg-hairline rounded-sm animate-pulse" />
                <div className="h-4 w-16 bg-hairline rounded-sm animate-pulse" />
                <div className="h-4 w-20 bg-hairline rounded-sm animate-pulse" />
                <div className="h-4 flex-1 bg-hairline rounded-sm animate-pulse" />
              </div>
            </div>
          }
        >
          <ExpenseListSection
            expenses={(expenses ?? []) as Expense[]}
            hasActiveFilter={hasActiveFilter}
          />
        </Suspense>
      </main>
    </div>
  )
}
