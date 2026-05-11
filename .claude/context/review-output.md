# Review Output
generated: 2026-05-12

## Summary

| Pass | CRITICAL | HIGH | MEDIUM | LOW | Auto-fixed |
|------|----------|------|--------|-----|------------|
| Code quality | 0 | 0 | 3 | 2 | n/a |
| Security     | 0 | 0 | 2 | 1 | 0          |
| Performance  | 0 | 0 | 1 | 2 | n/a        |

## Auto-fixed (critical security)
None. No CRITICAL issues were found.

---

## Code Quality

### MEDIUM

- **src/app/page.tsx:38 -- categoryFilter cast from URL param without validation**
  `params.category` is a raw URL string cast via `as ExpenseCategory | undefined` and passed
  directly into `.eq('category', categoryFilter)`. The Supabase SDK parameterizes it so there
  is no SQL injection, but an invalid value (e.g. `?category=DROP`) silently returns 0 rows
  without signalling an error. The API route `GET /api/expenses` correctly validates this
  through Zod (`expenseListQuerySchema`) -- the same guard should apply in the dashboard
  server component for consistency and correctness.
  Recommended fix: add a guard before the Supabase call:
  `const validCategory = EXPENSE_CATEGORIES.includes(categoryFilter as ExpenseCategory) ? categoryFilter as ExpenseCategory : undefined`

- **src/app/page.tsx:77 -- .select('*') on the expense list**
  The expense list query fetches all columns including `user_id`, `created_at`, and
  `updated_at`. Only `id, amount, category, spent_on, note` are actually rendered in
  `ExpenseRow`. Fetching every column wastes network bandwidth on every page load and
  serializes `user_id` (a server-internal field) into the client-rendered prop tree.
  Recommended fix: replace `.select('*')` with an explicit column list. The `Expense`
  type already defines the full shape -- use that as the contract.

- **src/components/expenses/ExpenseListSection.tsx:17-18 -- dead interface prop openAddDialog**
  `openAddDialog?: boolean` is declared in `ExpenseListSectionProps` but is not present in
  the component's destructured parameters on line 31. The prop is never read. Any caller
  passing it sees no effect, yet IDEs surface it as valid API surface.
  Recommended fix: remove the prop from the interface, or wire it to `setAddOpen` state
  if the triggered-from-outside feature was intentional.

### LOW

- **src/components/expenses/ExpenseFormDialog.tsx:79,123 -- silent no-op submit on empty amount (see also QA Issue 1)**
  `canSubmit = !errors.amount && !isSubmitting` evaluates to `true` on first render because
  react-hook-form does not populate `errors.amount` until the field is touched or the form
  is first submitted. The `onSubmit` guard at line 79 silently returns with no user feedback
  when amount is NaN or zero. The user clicks Save and nothing happens.
  Recommended fix: add `mode: 'onTouched'` to `useForm` so `errors.amount` is populated
  after the user tabs away, enabling the disabled state to engage before first submit.

- **src/components/expenses/ExpenseRow.tsx:22-29 + src/components/expenses/DeleteExpenseDialog.tsx:24-36 -- duplicated formatAmount / formatDate helpers**
  Both `formatAmount` and `formatDate` are defined identically in these two files. Any
  future change to currency locale or date format must be made in two places.
  Recommended fix: extract both functions to `src/lib/formatters.ts` and import from there.

---

## Security

### MEDIUM

- **src/middleware.ts:53-58 -- no next param sanitisation on login redirect (forward-looking note)**
  The middleware redirects unauthenticated users by setting `loginUrl.pathname = '/login'`
  directly -- this is safe as currently implemented because no `?next=` param is appended.
  Flagged as a forward-looking note: if a future change appends the original pathname as
  a `?next=` query param for post-login redirect, that parameter must be validated as a
  same-origin path before use to prevent open-redirect attacks.
  Recommended fix: no change needed now. If `?next=` is ever added, validate with
  `new URL(next, request.url).origin === request.nextUrl.origin` before redirecting.

- **src/app/error.tsx:16 -- full error object logged to browser console in all environments**
  `console.error('Dashboard error:', error)` runs inside a `useEffect` in a client
  component, meaning it executes in the browser in production. The `error` object may
  contain internal Supabase error messages, query fragments, or stack traces visible to
  anyone who opens browser DevTools.
  Recommended fix: gate on `process.env.NODE_ENV !== 'production'`, or log only
  `error.digest` (the Next.js opaque error ID) in production and route the full error
  to a server-side observability service (e.g. Sentry).

### LOW

- **No application-level rate limiting on auth endpoints**
  `POST /api/auth/signout` and the browser-client `signUp` / `signInWithPassword` calls
  have no application-layer rate limiting. Supabase built-in limits provide a baseline.
  Expected for MVP and not a blocker. Recommended before scaling to untrusted public traffic.

---

## Performance

### MEDIUM

- **src/app/page.tsx:53-90 -- two sequential Supabase queries on every dashboard load**
  The monthly summary query (lines 53-57) and the expense list query (lines 75-90) execute
  sequentially in the server component even though they are fully independent. On a cold
  serverless invocation this doubles the observable Supabase round-trip latency for every
  dashboard page load.
  Recommended fix: lift both queries into a `Promise.all` call and destructure the results.

### LOW

- **src/app/page.tsx:77 -- wildcard select on expense list (also a Code Quality finding)**
  Fetching all columns adds avoidable payload. `user_id` is 36 bytes per row; at the
  100-row default limit this is roughly 3.6 KB of unnecessary serialization per render.
  Recommended fix: use an explicit column list as noted in Code Quality above.

- **src/app/page.tsx:44-50 + src/app/api/expenses/summary/route.ts:44-71 -- duplicated month-boundary logic**
  The dashboard server component and the summary API route independently compute
  current-month date boundaries using divergent implementations (page: UTC `getUTCFullYear`;
  route: `Intl.DateTimeFormat` with timezone). This means users in non-UTC timezones see
  an incorrect monthly total in the hero MonthlyTotal component -- a documented MVP
  limitation in frontend-output.md. The duplication also means two codepaths to update
  when the logic changes.
  Recommended fix: extract to `src/lib/expense-aggregation.ts` (also resolves QA Issue 2)
  and propagate the user's timezone from the client (cookie or `Intl` on first load).

---

## Verdict

SHIP WITH FOLLOW-UPS -- no blocking issues. RLS is correctly enabled with all four policies
present in the migration file, matching exactly what backend-output.md and adr-output.md
specify. No hardcoded secrets, no service-role key usage anywhere in the codebase, no SQL
injection vectors, no `dangerouslySetInnerHTML`, and every Route Handler and server component
uses the cookie-bound Supabase client so `auth.uid()` is always in scope for RLS. The
findings above are correctness-polish and performance improvements appropriate for a short
follow-up sprint.

Priority order for follow-ups:
1. Security/MEDIUM -- Gate console.error in error.tsx to non-production only.
2. Code Quality/MEDIUM -- Validate categoryFilter against EXPENSE_CATEGORIES before passing to Supabase.
3. Performance/MEDIUM -- Parallelize the two Supabase calls in the dashboard with Promise.all.
4. Code Quality/MEDIUM -- Remove dead openAddDialog prop from ExpenseListSection interface.
5. Code Quality/LOW -- Extract formatAmount/formatDate to src/lib/formatters.ts.
6. Code Quality/LOW -- Add mode: 'onTouched' to ExpenseFormDialog useForm (QA Issue 1).
7. Performance/LOW -- Narrow .select('*') to explicit column list in dashboard page.
8. Performance/LOW -- Extract month-boundary logic to src/lib/expense-aggregation.ts (QA Issue 2).

---HANDOFF---
agent:     reviewer
completed: code quality + security + performance passes
auto_fixed: 0
blockers:  none
next:      Run /demo to generate the demo script and talking points
---END---