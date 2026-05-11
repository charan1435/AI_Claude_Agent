# Architecture Decision Record

## Project
Personal Expense Tracker — MVP

## Status
Accepted

## Date
2026-05-11

---

## 1. Context
We are building a single-user personal expense tracker: a private, authenticated dashboard where an individual logs daily spend (amount, category, date, optional note), reviews a list sorted newest-first, sees a running monthly total, and gets a current-month category breakdown. Every user only ever sees and mutates their own data — there is no multi-tenant organisation model, no admin role, and no shared data.

The key constraints are: (1) the data is per-user-private, so authentication and row-level isolation are first-class concerns, not bolt-ons; (2) the dataset per user is small (hundreds of rows over a year), so we optimise for development velocity and clarity over distributed-scale concerns; (3) the team needs a single deployment unit with a public URL on a free tier, and a fast local "clone → install → run" loop.

The architecture below favours a serverless full-stack Next.js + Supabase setup because it satisfies these constraints with the fewest moving parts. It also keeps the data model intentionally tiny (one `expenses` table) so the bulk of engineering effort can go into the UX of adding, listing, totalling, and breaking down expenses rather than into infrastructure.

---

## 2. Core Stack Decision

### Frontend — Next.js 14 App Router + TypeScript
**Decision:** Use Next.js 14 with App Router and TypeScript.
**Rationale:**
  - Server components let us fetch a user's expenses on the server with the Supabase server client, keeping the auth token off the wire and the initial payload small.
  - App Router middleware is the cleanest place to enforce "must be signed in to see `/dashboard` and `/expenses`" route protection.
  - Co-locating UI and API routes means one repo, one deploy, one mental model — appropriate for a one-table CRUD app.
  - TypeScript catches shape mismatches between Supabase row types and React props, which matters because the expense schema (amount, category enum, date, note) is referenced from many places.
**Alternatives considered:**
  - Vite + React + a separate Express/FastAPI backend: rejected — two services to run, CORS to configure, two deploys, no upside for a CRUD app of this size.
  - Remix: rejected — comparable SSR story but smaller ecosystem and less Vercel-native than Next.js.

### UI — Tailwind CSS + shadcn/ui
**Decision:** Tailwind CSS with shadcn/ui components.
**Rationale:**
  - shadcn/ui ships the component source into our repo rather than as a dependency, so we can tweak the Dialog (used for the Add/Edit expense modal), Select (category), Input (amount/note), and Button to match the design without forking a library.
  - Tailwind utility classes keep typography, spacing, and the category-breakdown bars consistent without a separate CSS file per component.
  - The shadcn DataTable / Card / Dialog primitives cover every screen this MVP needs (auth forms, dashboard cards, expense list, add/edit modal).
**Alternatives considered:**
  - MUI / Chakra: rejected — opinionated theming makes the lightweight, finance-app look harder to land and harder to customise later.
  - Plain CSS modules: rejected — slower iteration, no design tokens by default.

### Backend — Next.js API Routes (Route Handlers, serverless)
**Decision:** Next.js Route Handlers on Vercel serverless functions. No standalone backend server.
**Rationale:**
  - The whole API surface is `POST/GET/PATCH/DELETE /api/expenses` plus a `GET /api/expenses/summary` (monthly total + per-category totals). Route Handlers fit this perfectly.
  - One deployment unit makes the README's "clone, `npm install`, `npm run dev`" promise achievable.
  - Serverless functions scale to zero — appropriate for a single-user demo.
  - Server-side calls use the user-scoped Supabase client built from the request cookie, so RLS does the per-user filtering — we never need a custom authz layer.
**Alternatives considered:**
  - Express / FastAPI sidecar: rejected — adds a second service for no behaviour we can't get from Route Handlers + RLS.
  - Pure client-side Supabase calls (no Route Handlers): considered — viable for MVP, but Route Handlers give us one place to add server-side validation (positive amount, valid category, date sanity) and aggregation queries.

### Database / Auth — Supabase (PostgreSQL + Auth)
**Decision:** Supabase for PostgreSQL, Auth, and (if needed later) Storage.
**Rationale:**
  - Postgres RLS is the single most important security feature for this app: an `expenses` row carries `user_id`, and a policy `user_id = auth.uid()` makes data-leak bugs structurally impossible at the DB layer.
  - Supabase Auth gives us email + password signup, login, session cookies, and a `auth.users` table out of the box — the spec explicitly asks for email/password only, so we avoid the OAuth surface entirely.
  - Free tier is more than enough for the demo dataset.
**Alternatives considered:**
  - Firebase: rejected — Firestore is a poor fit for the aggregation queries (sum by category, sum for month) that the dashboard needs; SQL `GROUP BY` is the right tool.
  - PlanetScale + custom auth (NextAuth): rejected — more moving parts, and we'd have to build the per-row authorization that RLS gives us for free.
  - Self-hosted Postgres: rejected — over-engineering for a PoC.

### Storage — Supabase Storage (not used in MVP)
**Decision:** Available but unused. Notes are text-only; no receipts, no attachments.
**Rationale:** No upload signal in the spec. We keep the option open by virtue of using Supabase, with zero current cost.

### Deployment — Vercel
**Decision:** Deploy to Vercel.
**Rationale:**
  - Native Next.js support, preview deployments per PR, single env-var screen for `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`.
  - Free tier delivers the public URL required for the demo.
**Alternatives considered:**
  - Netlify / Cloudflare Pages: viable but less Next.js-native; not worth swapping.
  - Self-hosted on a VPS: rejected — extra ops effort for no PoC benefit.

### CI/CD — GitHub Actions
**Decision:** GitHub Actions for lint, typecheck, build, and test on every push and PR. Vercel handles deploys via its Git integration.
**Rationale:**
  - Same repo, visible reviews, free for this scale.
  - Splits the responsibilities cleanly: GitHub Actions = correctness gate, Vercel = deploy.

---

## 3. Optional Module Decisions
No optional modules activated (per `/plan` output).

  - Payments (Stripe) — not activated. No payment / subscription / billing signal in spec.
  - State management (Zustand) — not activated. No cart, wizard, or multi-step flow. React local state + server components are sufficient; the Add/Edit modal holds form state with `useState`, the list refetches via Server Actions or Route Handlers.
  - Realtime — not activated. No live/notification requirement. Data refreshes on navigation or after mutation.
  - File upload — not activated. Notes are plain text.
  - Email (Resend) — not activated. Supabase Auth handles its own confirmation/reset emails; no marketing or transactional email beyond that.
  - Social auth — not activated. Spec explicitly mandates email/password only.

---

## 4. Data Model

```
auth.users (managed by Supabase Auth)
  └── public.expenses
        - id              uuid          primary key, default gen_random_uuid()
        - user_id         uuid          not null, references auth.users(id) on delete cascade
        - amount          numeric(12,2) not null, check (amount > 0)
        - category        text          not null, check (category in ('Food','Transport','Bills','Other'))
        - spent_on        date          not null
        - note            text          null
        - created_at      timestamptz   not null default now()
        - updated_at      timestamptz   not null default now()
```

Key relationships:
  - `expenses.user_id` → `auth.users.id`. ON DELETE CASCADE so deleting a user removes their expenses.
  - There is no second user-facing table in MVP. Categories are a `check` constraint, not a separate table, because they are fixed and small (Food / Transport / Bills / Other).

Indexes:
  - `expenses (user_id, spent_on desc)` — supports the "newest first" list and the monthly windowing query.
  - `expenses (user_id, category, spent_on)` — supports the category-filtered list and the dashboard category-breakdown aggregation.

RLS policies on `public.expenses`:
  - `select`: `user_id = auth.uid()`
  - `insert`: `user_id = auth.uid()` (enforced via WITH CHECK)
  - `update`: `user_id = auth.uid()` (USING + WITH CHECK)
  - `delete`: `user_id = auth.uid()`

---

## 5. Security Decisions
  - RLS enabled on `public.expenses` from migration 0001; no route can opt out.
  - All Supabase server-side reads use the request-scoped client built from the auth cookie, so `auth.uid()` resolves correctly inside RLS.
  - The `SUPABASE_SERVICE_ROLE_KEY` is **server-only**, never imported into client bundles. Any Route Handler that needs it (none expected in MVP) must live under `/app/api/...`.
  - Form inputs are validated server-side in the Route Handler (amount > 0, category in enum, `spent_on` parseable as date) before insert — defence in depth on top of DB constraints.
  - `.env*` files are gitignored and the pre-commit secret-scan hook blocks accidental staging.
  - Passwords are never handled by our code — Supabase Auth manages hashing, session JWTs, and refresh.
  - HTTPS everywhere via Vercel; secure, HttpOnly auth cookies set by the Supabase SSR client.

---

## 6. Scalability Note

### Current architecture (PoC / demo)
A single Vercel serverless deployment talks to a single Supabase project. Each request opens a short-lived connection to Postgres via Supabase's connection pooler. The `expenses` table is the only data table. The dashboard makes two queries on load: a list query (latest N rows) and a per-category aggregation for the current month. Both are O(rows-for-this-user-this-month), which is tiny.

### At 10,000 users
  - Bottlenecks: per-request DB round trips dominate; Supabase pooler concurrency limits could be hit if many users land on the dashboard simultaneously; aggregation query runs on every dashboard load.
  - Mitigations:
    - Ensure the composite index `expenses (user_id, spent_on desc)` and `(user_id, category, spent_on)` are in place from day one.
    - Use Supabase's transaction-mode pooler for short Route Handler requests.
    - Cache the per-user monthly summary in a Next.js `revalidate`-tagged fetch, invalidated on mutation, to remove the aggregation query from the hot path.
    - Move the dashboard summary to a Postgres view or RPC (`get_monthly_summary(uid)`) so a single round-trip returns total + per-category breakdown.

### At 100,000 users
  - Bottlenecks: connection pool exhaustion under burst; cold-start latency on infrequently used regions; aggregation cost if any single user accumulates many years of data; absence of read replicas.
  - Mitigations:
    - Edge Route Handlers for read-only summary endpoints, served close to the user.
    - A Redis (Upstash) cache layer in front of the monthly summary, keyed by `user_id + YYYY-MM`, invalidated on write.
    - Read replica or Supabase's read-only endpoint for analytics-style queries; writes continue to primary.
    - Partition `expenses` by year if any user crosses ~1M rows (unlikely in this product, but cheap to plan for).
    - Background jobs (Supabase Edge Functions or a queue) for any future heavy work — none needed in MVP.

### Observability
  - **Logging:** Vercel function logs for Route Handlers; Supabase logs for DB and Auth. Both retained on free tier for short windows — acceptable for PoC.
  - **Monitoring:** Vercel Analytics for page-level latency; Supabase dashboard for slow query alerts.
  - **Error tracking:** Sentry recommended once we leave PoC (free tier sufficient). Not wired in MVP to keep the dependency surface small.
  - **Audit:** every `expenses` row carries `created_at` and `updated_at`; a future `expense_events` table can be added without a breaking change.

---

## 7. Key Trade-offs Summary
| Decision                          | Benefit                                            | Trade-off                                                       |
|-----------------------------------|----------------------------------------------------|-----------------------------------------------------------------|
| Next.js full-stack (Route Handlers)| One repo, one deploy, simpler local dev           | Tied to Vercel/Node runtime; less flexible than a polyglot stack|
| Supabase (Postgres + Auth + RLS)  | Per-user isolation enforced at the DB; fast setup | Vendor lock-in on Auth + RLS dialect                            |
| RLS-only authorization            | Data-leak bugs are structurally hard               | All access must go through the user-scoped client; service-role use needs care |
| Category as `check` constraint    | Simple, fast, no extra table                       | Adding a category later requires a migration                    |
| `numeric(12,2)` for amount        | Exact decimal math, no float drift                 | Slightly heavier than `int cents`; we accept this for clarity   |
| Local-time month boundaries (UI)  | "Current month" matches user expectation          | Two users in different timezones near midnight see different totals — acceptable for a single-user app |
| Vercel free tier                  | Zero config, public URL out of the box             | Cold starts; cost scales steeply past free tier                 |
| shadcn/ui                         | Fully owned component source, easy to restyle      | More initial setup than installing a pre-themed library         |
| No state library (Zustand etc.)   | One less dependency, simpler mental model          | Will need to introduce one if global state appears later        |

---
