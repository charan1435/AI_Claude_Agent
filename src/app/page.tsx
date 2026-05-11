import { Suspense } from 'react'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/layout/AppHeader'
import { MonthlyTotal } from '@/components/dashboard/MonthlyTotal'
import { CategoryBreakdown } from '@/components/dashboard/CategoryBreakdown'
import { ExpenseListSection } from '@/components/expenses/ExpenseListSection'
import type { Expense } from '@/types/expense'
import { EXPENSE_CATEGORIES, type ExpenseCategory } from '@/lib/validation/expense'
import {
  aggregateMonthlyTotals,
  getCurrentMonthBoundaries,
} from '@/lib/expense-aggregation'

const EXPENSE_LIST_COLUMNS = 'id, amount, category, spent_on, note' as const

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
  const categoryFilter: ExpenseCategory | undefined =
    params.category && EXPENSE_CATEGORIES.includes(params.category as ExpenseCategory)
      ? (params.category as ExpenseCategory)
      : undefined
  const searchQuery = params.q

  // ── Month boundaries (UTC for the server component) ────────────────
  const { monthStart, monthEndExclusive } = getCurrentMonthBoundaries('UTC')

  // ── Build the expense list query ───────────────────────────────────
  let listQuery = supabase
    .from('expenses')
    .select(EXPENSE_LIST_COLUMNS)
    .order('spent_on', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100)

  if (categoryFilter) {
    listQuery = listQuery.eq('category', categoryFilter)
  }

  if (searchQuery) {
    listQuery = listQuery.ilike('note', `%${searchQuery}%`)
  }

  // ── Fire summary + list queries in parallel ────────────────────────
  const [summaryResult, listResult] = await Promise.all([
    supabase
      .from('expenses')
      .select('amount, category')
      .gte('spent_on', monthStart)
      .lt('spent_on', monthEndExclusive),
    listQuery,
  ])

  const { total: monthTotal, byCategory } = aggregateMonthlyTotals(
    summaryResult.data ?? []
  )
  const expenses = listResult.data ?? []

  // ── Month label ─────────────────────────────────────────────────────
  const monthLabel = new Date().toLocaleDateString('en-US', {
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
            expenses={expenses as Expense[]}
            hasActiveFilter={hasActiveFilter}
          />
        </Suspense>
      </main>
    </div>
  )
}
