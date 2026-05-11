# Jira Output (STUB — /jira was skipped)
generated: 2026-05-11
note: This is a local stub used only so /develop has stable ticket IDs for commit messages. No real Jira tickets were created. Replace with real MCP output by running /jira at any time.

## Epic
  PROJ-1 — Personal Expense Tracker — MVP

## Stories
  PROJ-2  Auth: email/password signup and login (Supabase Auth + middleware)
  PROJ-3  Data: expenses schema + RLS policies + indexes
  PROJ-4  API:  expenses CRUD route handlers (POST/GET/PATCH/DELETE) + Zod validation
  PROJ-5  API:  monthly summary endpoint (total + per-category breakdown)
  PROJ-6  UI:   /login and /signup screens (Ledger aesthetic)
  PROJ-7  UI:   dashboard page (monthly total + category breakdown)
  PROJ-8  UI:   expense list with hairline rows, filter pills, debounced search
  PROJ-9  UI:   Add/Edit expense modal (segmented category picker, amount input, date, note)
  PROJ-10 UI:   Delete confirm dialog
  PROJ-11 QA:   unit tests (Zod schemas, summary aggregation)
  PROJ-12 QA:   component tests (forms, list, dialogs)
  PROJ-13 QA:   e2e tests (auth flow, CRUD flow, filter+search)
  PROJ-14 QA:   RLS isolation test (user A cannot read/write user B's rows)
  PROJ-15 Ops:  README + .env.example + deploy readiness

## Commit ID guidance for subagents
- Backend subagent: use PROJ-3, PROJ-4, PROJ-5 (and PROJ-2 for any auth-related server bits).
- Frontend subagent: use PROJ-6 through PROJ-10.
- QA subagent: use PROJ-11 through PROJ-14.
- Deploy subagent: use PROJ-15.
- One ticket per commit; format `PROJ-XX: short description`.

---HANDOFF---
agent:     planning (stub)
completed: local-only Jira stub for ticket IDs
epic:      PROJ-1 Personal Expense Tracker — MVP
stories:   PROJ-2 … PROJ-15
next:      /develop can proceed
---END---
