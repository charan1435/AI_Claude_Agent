# Backend Output
generated: 2026-05-11

## Schema

### Tables created

**public.expenses**
| Column     | Type              | Constraints                                                              |
|------------|-------------------|--------------------------------------------------------------------------|
| id         | uuid              | PRIMARY KEY, DEFAULT gen_random_uuid()                                   |
| user_id    | uuid              | NOT NULL, FK → auth.users(id) ON DELETE CASCADE                          |
| amount     | numeric(12,2)     | NOT NULL, CHECK (amount > 0)                                             |
| category   | text              | NOT NULL, CHECK (category IN ('Food','Transport','Bills','Other'))        |
| spent_on   | date              | NOT NULL                                                                 |
| note       | text              | NULL                                                                     |
| created_at | timestamptz       | NOT NULL, DEFAULT now()                                                  |
| updated_at | timestamptz       | NOT NULL, DEFAULT now() — auto-updated by trigger on every UPDATE        |

### RLS policies (all on public.expenses)

| Policy name              | Operation | Gate                          |
|--------------------------|-----------|-------------------------------|
| expenses_select_own      | SELECT    | USING (auth.uid() = user_id)  |
| expenses_insert_own      | INSERT    | WITH CHECK (auth.uid() = user_id) |
| expenses_update_own      | UPDATE    | USING + WITH CHECK (auth.uid() = user_id) |
| expenses_delete_own      | DELETE    | USING (auth.uid() = user_id)  |

### Indexes

| Index name                          | Columns                            | Purpose                                    |
|-------------------------------------|------------------------------------|--------------------------------------------|
| idx_expenses_user_spent_on          | (user_id, spent_on DESC)           | List view sorted newest-first              |
| idx_expenses_user_category_spent_on | (user_id, category, spent_on)      | Category filter and breakdown queries      |

### Migrations

- `supabase/migrations/0001_init_expenses.sql`

---

## API Routes

### POST /api/expenses
- **Auth**: required (401 if unauthenticated)
- **Input body** (JSON):
  ```json
  { "amount": 12.50, "category": "Food", "spent_on": "2026-05-11", "note": "Lunch" }
  ```
  - `amount`: number > 0, max 2 decimal places, required
  - `category`: one of "Food" | "Transport" | "Bills" | "Other", required
  - `spent_on`: string YYYY-MM-DD, required
  - `note`: string max 500 chars, optional/nullable
- **Success**: `201` `{ data: <expense row>, error: null }`
- **Errors**: `400` field-level Zod errors | `401` | `500`

### GET /api/expenses
- **Auth**: required (401 if unauthenticated)
- **Query params**:
  - `category`: "Food" | "Transport" | "Bills" | "Other" (optional)
  - `q`: text to ILIKE-match against note (optional)
  - `limit`: integer 1–500, default 100
- **Success**: `200` `{ data: <expense row>[], error: null }` sorted by spent_on desc, created_at desc
- **Errors**: `400` | `401` | `500`

### PATCH /api/expenses/[id]
- **Auth**: required (401 if unauthenticated)
- **Input body** (JSON): partial of create schema — at least one field required
  ```json
  { "amount": 15.00 }
  ```
- **Success**: `200` `{ data: <updated expense row>, error: null }`
- **Errors**: `400` (validation or bad UUID) | `401` | `404` (not found or owned by another user) | `500`

### DELETE /api/expenses/[id]
- **Auth**: required (401 if unauthenticated)
- **Success**: `200` `{ data: { id: "<uuid>" }, error: null }`
- **Errors**: `400` (bad UUID) | `401` | `404` | `500`

### GET /api/expenses/summary
- **Auth**: required (401 if unauthenticated)
- **Query params**:
  - `tz`: IANA timezone string e.g. "America/New_York" (optional, defaults to UTC)
- **Success**: `200`
  ```json
  {
    "data": {
      "month": "2026-05",
      "total": 342.50,
      "byCategory": { "Food": 120.00, "Transport": 45.50, "Bills": 177.00, "Other": 0.00 }
    },
    "error": null
  }
  ```
- **Errors**: `401` | `500`
- **Note**: Month boundaries are computed server-side using the caller's IANA timezone. Invalid/missing tz silently falls back to UTC.

### POST /api/auth/signout
- **Auth**: not required (silently ignores unauthenticated calls)
- **Success**: `204` No Content
- **Errors**: none — always returns 204

---

## Zod Schemas

All exported from `src/lib/validation/expense.ts`:

| Export                    | Purpose                                                    |
|---------------------------|------------------------------------------------------------|
| `expenseCreateSchema`     | Validates POST body for creating an expense                |
| `ExpenseCreateInput`      | Inferred TypeScript type for create input                  |
| `expenseUpdateSchema`     | Validates PATCH body (partial create, min 1 field)         |
| `ExpenseUpdateInput`      | Inferred TypeScript type for update input                  |
| `expenseListQuerySchema`  | Validates GET query params (category, q, limit)            |
| `ExpenseListQuery`        | Inferred TypeScript type for list query                    |
| `summaryQuerySchema`      | Validates GET /summary query params (tz)                   |
| `SummaryQuery`            | Inferred TypeScript type for summary query                 |
| `EXPENSE_CATEGORIES`      | `readonly ['Food','Transport','Bills','Other']` const array|
| `ExpenseCategory`         | Union type `'Food' | 'Transport' | 'Bills' | 'Other'`      |

---

## Env Vars Required

Documented in `.env.example`:

| Variable                      | Required | Notes                                             |
|-------------------------------|----------|---------------------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`    | YES      | Supabase project URL                              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | YES    | Supabase anon (public) key                        |

The service-role key is intentionally NOT required — RLS handles all authorization.

---

## Contract for Frontend

### Client imports

- **Server Components / Route Handlers**: import `createServerClient` from `@/lib/supabase/server`
- **Client Components** (`'use client'`): import `createClient` from `@/lib/supabase/client`
- **Zod types**: import from `@/lib/validation/expense` — `ExpenseCreateInput`, `ExpenseUpdateInput`, `ExpenseCategory`, `EXPENSE_CATEGORIES`

### Auth flow

- Supabase email/password sign-up and login are handled via the browser Supabase client calling `supabase.auth.signUp()` / `supabase.auth.signInWithPassword()` directly from Client Components. No custom API route is needed for these.
- The middleware at `src/middleware.ts` automatically refreshes sessions and redirects unauthenticated users to `/login`. Public paths: `/login`, `/signup`, `/auth/*`.
- Sign-out: call `POST /api/auth/signout`, then redirect to `/login` client-side.

### Timezone for summary

- The frontend should pass the user's local timezone when calling the summary endpoint: `GET /api/expenses/summary?tz=<Intl.DateTimeFormat().resolvedOptions().timeZone>`.
- If omitted or invalid, the server falls back to UTC.

### Response shape (all routes)

All routes return `{ data: T | null, error: string | object | null }`. The frontend should always check `error` before consuming `data`.

### 404 behaviour

Non-owner rows look missing (not forbidden) — this is intentional. A PATCH or DELETE on an id that belongs to another user returns 404, not 403.

### Supabase client note

Do NOT use the browser client (`@/lib/supabase/client`) in Server Components or Route Handlers — RLS will not see `auth.uid()` correctly. Use the server client from `@/lib/supabase/server` instead, which reads the session from the request cookie.

---HANDOFF---
agent:     backend
completed: Next.js 14 scaffold initialized; Supabase migration with RLS + indexes; cookie-bound
           server client; browser client; auth middleware with redirect; Zod validation schemas;
           5 route handlers (POST/GET expenses, PATCH/DELETE expenses/[id], GET expenses/summary,
           POST auth/signout); .env.example; typecheck passes cleanly.
routes:    6 (POST /api/expenses, GET /api/expenses, PATCH /api/expenses/[id],
              DELETE /api/expenses/[id], GET /api/expenses/summary, POST /api/auth/signout)
tables:    1 (public.expenses)
modules:   none
issues:
  - Zod v4 (4.4.3) is installed — its API differs from Zod v3. Use `error:` instead of
    `required_error:` / `invalid_type_error:` in schema options. The validation schemas already
    use the v4 API.
  - Next.js version installed is 16.x (latest at scaffold time). The App Router pattern is
    identical to 14.x for the purposes of this project.
  - The `params` prop in dynamic route handlers is now a Promise in Next.js 15+; the route
    handlers already `await params` accordingly.
  - `cookies()` from `next/headers` is async in Next.js 15+; `createServerClient` in
    server.ts already `await`s it.
  - shadcn/ui is NOT yet initialized. The frontend agent must run `npx shadcn@latest init`
    to set up the component library before building UI.
  - The default `src/app/page.tsx` and `src/app/layout.tsx` from the scaffold are untouched —
    the frontend agent should replace their contents.
next:      Frontend subagent should consume the 6 routes listed above. Auth pages (/login, /signup)
           must use the browser Supabase client for signUp/signInWithPassword. All data-fetching
           pages should hit the API routes. Run `npx shadcn@latest init` first. Pass
           `Intl.DateTimeFormat().resolvedOptions().timeZone` as the `?tz=` param to the summary
           endpoint.
---END---
