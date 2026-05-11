# Plan Output
generated: 2026-05-11
command: /plan

## App Type
SaaS dashboard (single-user personal finance tracker). The product is a private, authenticated dashboard where each signed-in user manages and analyses their own expense records. No multi-tenant org structure, no admin role — one user, one private dataset.

## Problem Statement
Individuals want a simple, low-friction way to record day-to-day expenses and understand where their money is going each month. This app lets a user sign up with email and password, log expenses (amount, category, date, optional note), and immediately see a list of their spending, a running monthly total, and a category breakdown for the current month — all scoped strictly to their own data.

## Core Features
MUST:
  - Email/password signup and login backed by Supabase Auth, with session handling and protected routes.
  - Authenticated user can create an expense with amount, category (Food / Transport / Bills / Other), date, and optional note.
  - Authenticated user can edit any of their own expenses.
  - Authenticated user can delete any of their own expenses.
  - List view of expenses sorted by date (newest first), scoped to the current user only.
  - Monthly total of expenses for the current calendar month shown above the list.
  - Dashboard view showing current-month spend broken down by category.
  - Row-level security enforcing that a user can only read/write their own expense rows.

SHOULD:
  - Filter the expense list by category (Food / Transport / Bills / Other).
  - Search expenses by free-text match against the note field.

NICE-TO-HAVE:
  - Empty-state UX guiding a new user to add their first expense from the dashboard.
  - Inline form validation (positive amount, valid date, category required) with friendly errors.
  - Confirmation step before destructive delete actions.
  - Sign-out control in the app header.

## User Journeys
1. New user signs up with email + password → is redirected to the dashboard → sees an empty state → opens the "Add expense" modal → submits amount, category, date, optional note → expense appears in the list and contributes to the monthly total and category breakdown.
2. Returning user logs in → lands on the dashboard → reviews current-month total and category breakdown → scrolls the list (newest first) to review recent activity.
3. User notices an incorrect expense → clicks edit on the row → updates amount/category/date/note in a modal → list, monthly total, and category breakdown reflect the change.
4. User deletes a duplicate or wrong expense → confirms the delete → row disappears, monthly total and category breakdown recalculate.

## Activated Optional Modules
None.

Rationale (no modules activated):
  - payments.md — spec contains no payment/checkout/subscription/billing/invoice signals.
  - state-mgmt.md — no cart, wishlist, multi-step or wizard flow; simple per-page state is sufficient.
  - realtime.md — no live/real-time/notification/chat requirement; reads happen on navigation/refresh.
  - file-upload.md — no upload/image/file/attachment/avatar requirement (notes are text only).
  - email.md — spec mentions no transactional email beyond Supabase's built-in auth flow.
  - auth-social.md — spec explicitly states "Email/password signup and login"; no Google/OAuth/SSO signal.

## Stack
  Core: Next.js 14 (App Router) + TypeScript, Tailwind CSS + shadcn/ui, Supabase (PostgreSQL + Auth), Vercel, GitHub Actions, Jira.
  Optional: none.

## Suggested Jira Epic Name
Personal Expense Tracker — MVP

## Milestones
  1. Auth & Schema — Supabase project provisioned, `expenses` table with RLS policies, email/password signup + login + protected routes working end-to-end.
  2. Expense CRUD — Add / edit / delete expense flows complete via modal, with validation; list view renders user's expenses sorted newest-first.
  3. Dashboard & Totals — Monthly total above the list and current-month category breakdown on the dashboard, both updating after every CRUD action.
  4. Filter & Search — Category filter and note text search wired into the list view.
  5. Polish & Ship — Empty states, delete confirmation, sign-out, responsive layout, deploy to Vercel.

## Risks and Assumptions
  - Risk: Spec is silent on currency. Likelihood: MEDIUM. Mitigation: assume a single, display-only currency for MVP (USD, formatted client-side) and store amount as numeric. Revisit if multi-currency emerges later.
  - Risk: Spec is silent on amount precision and negative amounts (refunds). Likelihood: MEDIUM. Mitigation: store amount as `numeric(12,2)`, reject non-positive values at the form layer for MVP.
  - Risk: "Monthly total" timezone definition is ambiguous (UTC vs. user local). Likelihood: MEDIUM. Mitigation: define current month using the browser's local time for display, and store `date` as a calendar `date` (no time component) to keep totals stable across timezones.
  - Risk: Categories are fixed in the spec (Food, Transport, Bills, Other). Likelihood: LOW. Assumption: enforce as a Postgres enum or `check` constraint; no user-defined categories in MVP.
  - Risk: Search on `note` may be slow at scale. Likelihood: LOW (single-user dataset). Mitigation: simple `ILIKE` query for MVP; add a trigram index only if list size warrants it.
  - Risk: Supabase email confirmation behaviour (auto-confirm vs. confirm-by-email) is not specified. Likelihood: MEDIUM. Assumption: enable email confirmation in non-prod only if it does not block demo; default MVP to instant sign-in after signup.
  - Risk: Pagination is not specified for the list view. Likelihood: LOW for MVP. Assumption: render the most recent N (e.g. 100) expenses for MVP; defer infinite scroll/pagination.
  - Assumption: No data export, no recurring expenses, no budgets/limits, no shared accounts — these are explicitly out of scope for MVP.

---HANDOFF---
agent:     planning
completed: spec analysed, plan produced
modules:   none
epic:      Personal Expense Tracker — MVP
next:      Run /jira to create Jira Epic, Stories and Tasks
---END---
