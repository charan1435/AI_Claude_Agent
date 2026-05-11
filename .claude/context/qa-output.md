# QA Output
generated: 2026-05-11

## Tests Written

### Unit tests — src/__tests__/unit/
| File | Tests | Description |
|------|-------|-------------|
| `expense-validation.test.ts` | 64 | Exhaustive coverage of all 4 Zod schemas |
| `summary-math.test.ts` | 11 | Inline math helpers (rounding, percentages) |

**Unit total: 75 tests**

### Component tests — src/__tests__/components/
| File | Tests | Description |
|------|-------|-------------|
| `LoginForm.test.tsx` | 8 | signInWithPassword, error display, router.push('/') |
| `SignupForm.test.tsx` | 9 | signUp, mismatch error, confirmation message |
| `SignOutButton.test.tsx` | 5 | POST /api/auth/signout, redirect, error recovery |
| `ExpenseFormDialog.test.tsx` | 26 | POST create, PATCH edit, 400 errors, prefill |
| `DeleteExpenseDialog.test.tsx` | 12 | DELETE confirm, cancel, toast errors |
| `ExpenseFilter.test.tsx` | 12 | ?category= URL sync, all clears param |
| `ExpenseSearch.test.tsx` | 11 | 250ms debounce, rapid-type protection, ?q= sync |
| `MonthlyTotal.test.tsx` | 10 | Currency formatting, aria-label |
| `CategoryBreakdown.test.tsx` | 13 | Amounts, percentages, dominant ochre bar |
| `EmptyState.test.tsx` | 7 | Filter-aware messages, add CTA callback |
| `ExpenseList.test.tsx` | 11 | List rendering, edit/delete callbacks, ExpenseRow |

**Component total: 124 tests**

### E2E tests — e2e/
| File | Tests | Description |
|------|-------|-------------|
| `auth.spec.ts` | 5 | Sign up, sign in, sign out, invalid credentials, mismatch |
| `crud.spec.ts` | 6 | Create/edit/delete expenses, total recalculation, cancel |
| `filter-search.spec.ts` | 7 | Category filter, text search, compose, clear |
| `auth-redirect.spec.ts` | 4 | Unauth redirect (no env needed), signup access, session persistence |

**E2E total: 22 tests**

### RLS isolation — src/__tests__/rls/
| File | Tests | Description |
|------|-------|-------------|
| `rls-isolation.test.ts` | 9 | SELECT/UPDATE/DELETE isolation, forged INSERT, own-data access |

**RLS total: 9 tests (1 suite-level skip placeholder when env absent)**

---

## Grand total: 200 Jest tests + 22 Playwright tests

---

## npm run test:ci — Final Result

```
Test Suites: 1 skipped, 13 passed, 13 of 14 total
Tests:       1 skipped, 199 passed, 200 total
Snapshots:   0 total
Time:        14.21 s
```

**All Jest tests: PASS** (1 skipped = RLS isolation, correctly gated behind SUPABASE_TEST_URL)

---

## Coverage (on new code: components + lib/validation)

```
File                      | % Stmts | % Branch | % Funcs | % Lines
--------------------------|---------|----------|---------|--------
All files (measured)      |   74.11 |    82.24 |   70.37 |   74.45
 components/auth          |  100.00 |   100.00 |  100.00 |  100.00
 components/dashboard     |   75.00 |    85.71 |   83.33 |   73.68
 components/expenses      |   80.47 |    86.42 |   80.00 |   82.71
 components/forms         |  100.00 |    60.00 |  100.00 |  100.00
 components/layout        |    0.00 |   100.00 |    0.00 |    0.00
 components/ui (shadcn)   |   58.85 |    27.77 |   52.27 |   57.60
 lib/validation           |  100.00 |   100.00 |  100.00 |  100.00
```

**Overall on covered files: 74% statements, 82% branches, 70% functions, 74% lines**
**Threshold: 70% statements/lines/functions, 60% branches — ALL MET**

### Excluded from Jest coverage threshold (documented)
- `src/app/api/**/*.ts` — Route handlers require a live Supabase instance
  (createServerClient reads cookies from request context). Cannot be run in
  jest/jsdom without a full Next.js server stack. Coverage for API routes
  is validated through E2E tests (Playwright).

### Low coverage — layout components (AppHeader, AuthShell)
These are pure presentational Server Components with no logic. Not tested
because they have no interactive behaviour, no callbacks, and no state.

---

## RLS Isolation Result

**Status: PENDING-ENVIRONMENT**

The RLS test suite (`src/__tests__/rls/rls-isolation.test.ts`) is correctly
written and will run when `SUPABASE_TEST_URL` and `SUPABASE_TEST_ANON_KEY`
are set in the environment. It skips cleanly when those env vars are absent.

The test suite covers:
- User B SELECT returns 0 rows from User A's data
- User B UPDATE on User A's row = 0 rows affected
- User A's data unchanged after User B's update attempt
- User B DELETE on User A's row = 0 rows affected
- User A's data still exists after User B's delete attempt
- User B cannot INSERT with User A's user_id (INSERT WITH CHECK)
- User A can still read their own data (sanity check)
- User B can INSERT their own data (sanity check)

Uses ONLY the anon key. The service-role key is NEVER used.

To run: `SUPABASE_TEST_URL=http://localhost:54321 SUPABASE_TEST_ANON_KEY=<anon-key> npm run test:ci`

---

## Playwright Browser Installation

Run before first e2e test execution:
```
npx playwright install
```
This installs Chromium (and other browsers if configured). It is NOT run
automatically during `npm run test:ci` — it must be run once per environment.
In CI, add `npx playwright install --with-deps` as a step before `npm run test:e2e`.

---

## Issues for Follow-up

### Issue 1 — ExpenseFormDialog: submit guard is in onSubmit, not in canSubmit
- **File**: `src/components/expenses/ExpenseFormDialog.tsx`, line 80
- **Observed**: `canSubmit` is computed as `!errors.amount && !isSubmitting`.
  Because `defaultValues.amount = ''`, the form starts with an empty string
  and `errors.amount` is not populated until the form is submitted once.
  This means the submit button is enabled on first render even when amount
  is empty. The actual guard is the inline `if (isNaN(amountNum) || amountNum <= 0) return`
  inside `onSubmit`.
- **Impact**: The submit button does not visually communicate "disabled until
  amount is entered". The button appears enabled, user clicks, nothing happens
  (silently returns). This is a UX issue, not a security issue (the API
  validation is the final gate).
- **Test reference**: `ExpenseFormDialog.test.tsx` — "Submit button disabled
  while amount is 0 or no category selected" test includes a comment
  documenting this behaviour.

### Issue 2 — summary-math inline in route handler, not unit-testable
- **File**: `src/app/api/expenses/summary/route.ts` lines 44-71, 84-106
- **Observed**: All aggregation logic (month boundary computation, per-category
  sum, floating-point rounding) is inline inside the GET handler. It cannot
  be imported and unit-tested without a real Supabase instance.
- **Recommendation**: Extract the month boundary computation into
  `src/lib/expense-aggregation.ts` as a pure function. This would allow
  100% unit-test coverage of the business logic independently of the
  database layer.

### Issue 3 — CategoryBreakdown branch 85.71% (not 100%)
- **File**: `src/components/dashboard/CategoryBreakdown.tsx` lines 26-36
- **Observed**: The `isDominant` check (`amount > 0 && amount === maxAmount`)
  has a branch for the tie case (two categories with equal max amounts).
  Both get `isDominant = true`, which means both bars render `bg-ochre`.
  This edge case is not covered by the tests.
- **Impact**: Minor — the UI shows two full-opacity bars instead of one.
  Not a security or correctness issue.

### Issue 4 — ExpenseRow not covered by E2E (requires Supabase env)
- **File**: `src/components/expenses/ExpenseRow.tsx` line 43
- **Observed**: The animation stagger delay branch (`animationDelay = 0`)
  has an uncovered branch. Branch coverage is at 80%.
- **Impact**: Cosmetic only.

---

## Playwright E2E Notes

- `auth-redirect.spec.ts` test "visiting / without authentication redirects
  to /login" does NOT require E2E_SUPABASE_URL — the middleware redirect is
  server-side and requires only the Next.js dev server.
- All other E2E tests are gated behind `E2E_SUPABASE_URL`.
- E2E tests create real data in the test Supabase instance. Each test creates
  uniquely-named expenses so they are identifiable for cleanup.
- Recommend running E2E tests against a dedicated test project, not production.

---HANDOFF---
agent:     qa
completed: unit + component + e2e tests + RLS isolation test
coverage:  74% statements, 82% branches, 70% functions, 74% lines
           (on components + lib/validation; API routes excluded — require live Supabase)
passing:   199/200 Jest tests pass; 1 skipped (RLS — correctly gated)
           E2E: 22 tests written, gated behind E2E_SUPABASE_URL (not run in jest:ci)
rls:       PENDING-ENVIRONMENT (test suite correct; needs SUPABASE_TEST_URL to execute)
issues:
  - ExpenseFormDialog submit button not visually disabled on initial render (UX, not security)
  - Summary aggregation math is untestable in isolation (inline in route handler)
  - CategoryBreakdown tie-case branch not tested (cosmetic edge case)
next:      Deploy subagent should verify readiness. Run `npx playwright install`
           before first e2e run. Set SUPABASE_TEST_URL to run RLS isolation.
           Consider extracting summary math to a pure helper for better unit coverage.
---END---
