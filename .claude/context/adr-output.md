# ADR Output
generated: 2026-05-11

## Stack locked
  Frontend:  Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
  Backend:   Next.js Route Handlers (serverless on Vercel)
  Database:  Supabase PostgreSQL (with Row-Level Security)
  Auth:      Supabase Auth (email + password)
  Storage:   Supabase Storage (available but unused in MVP)
  Deploy:    Vercel
  CI/CD:     GitHub Actions (lint, typecheck, build, test)
  Optional:  none activated

## Key decisions
  - Full-stack Next.js: Route Handlers replace any standalone backend; one repo, one deploy.
  - RLS-only authorization on `public.expenses` (`user_id = auth.uid()` for select/insert/update/delete) — per-user isolation enforced at the DB.
  - Server-side Supabase client (built from the request cookie) used inside Route Handlers and server components so RLS sees the correct `auth.uid()`.
  - `SUPABASE_SERVICE_ROLE_KEY` is server-only; never imported in client code or Route Handlers that don't need it (MVP needs none).
  - Categories modelled as a `check` constraint on `expenses.category` (Food/Transport/Bills/Other) — no separate lookup table for MVP.
  - `amount` stored as `numeric(12,2)` with `check (amount > 0)`; double-validated in Route Handlers before insert/update.
  - Composite indexes `(user_id, spent_on desc)` and `(user_id, category, spent_on)` to back the list view, monthly total, and category breakdown.
  - "Current month" computed in user-local time in the UI; `spent_on` stored as a plain `date` (no time component) to keep totals stable across timezones.
  - No state-management library; React local state + server components/actions are sufficient.
  - Dashboard category breakdown will move to a Postgres view or RPC (`get_monthly_summary`) if it becomes the hot path; not required in MVP.

## Data model entities
  - auth.users (managed by Supabase Auth — referenced, not created by us)
  - public.expenses (id uuid pk, user_id uuid fk → auth.users, amount numeric(12,2), category text check, spent_on date, note text null, created_at timestamptz, updated_at timestamptz)

---HANDOFF---
agent:     architecture
completed: ADR.md written to project root; stack and data model confirmed
stack:     Next.js 14 + TS + Tailwind + shadcn/ui + Supabase (Postgres + Auth) + Vercel + GitHub Actions
entities:  auth.users, public.expenses
next:      Run /ux to produce wireframes and collect design references
---END---
