# Personal Expense Tracker

A private, authenticated dashboard where an individual logs daily spending and understands where their money goes each month. Sign up with email and password, record expenses with an amount, category (Food / Transport / Bills / Other), date, and optional note, then see your running monthly total and a per-category breakdown — all scoped strictly to your own data. Expenses can be filtered by category, searched by note text, edited, and deleted, with a confirmation step before any destructive action.

---

## Stack

- **Next.js 16 (App Router) + TypeScript** — server components fetch data server-side; middleware enforces auth-protected routes
- **Tailwind CSS + shadcn/ui** — component source is owned in-repo, themed to the Ledger palette (Newsreader display font, IBM Plex Sans body, IBM Plex Mono for numbers)
- **Supabase (PostgreSQL + Auth)** — Row-Level Security on the `expenses` table makes per-user data isolation structurally enforced at the database layer; email/password auth out of the box
- **Vercel** — one-command deploy with preview URLs per PR
- **GitHub Actions** — CI gate: lint, typecheck, build, and test on every push

---

## Prerequisites

- Node.js 20 or later (`node --version` to check)
- npm (bundled with Node)
- A free Supabase project — create one at [supabase.com](https://supabase.com)
- Playwright browsers (one-time install, only needed for end-to-end tests): `npx playwright install`

---

## Run locally in under 5 minutes

### 1. Clone

```bash
git clone <repo-url>
cd personal-expense-tracker
```

### 2. Install

```bash
npm install
```

### 3. Environment

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your Supabase project values. Find them in the Supabase dashboard under **Project Settings > API**:

- `NEXT_PUBLIC_SUPABASE_URL` — your project URL (e.g. `https://abcdefghijkl.supabase.co`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your anon (public) key

### 4. Database

In the [Supabase SQL Editor](https://supabase.com/dashboard), open your project, click **SQL Editor**, paste the contents of `supabase/migrations/0001_init_expenses.sql`, and click **Run**.

This creates the `expenses` table, enables Row-Level Security, adds all four RLS policies (SELECT / INSERT / UPDATE / DELETE), and creates the two performance indexes.

Alternatively, if you have the Supabase CLI installed and linked to your project:

```bash
npx supabase db push
```

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up with any email and password to get started.

---

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Dev server | `npm run dev` | Starts Next.js on http://localhost:3000 with Turbopack |
| Production build | `npm run build` | Compiles and type-checks; must pass before deploy |
| Production server | `npm run start` | Serves the production build locally |
| Lint | `npm run lint` | ESLint on all source files |
| Type check | `npm run typecheck` | `tsc --noEmit` — zero-error TypeScript |
| Unit + component tests | `npm run test` | Jest in watch mode |
| CI test gate | `npm run test:ci` | Jest with coverage; fails if thresholds are not met |
| End-to-end tests | `npm run test:e2e` | Playwright (requires a running dev server + Supabase) |

---

## Architecture

Full decisions and trade-offs are documented in [ADR.md](./ADR.md).

**Directory layout:**

```
src/
  app/
    (auth)/login/        Sign-in page
    (auth)/signup/       Sign-up page
    api/expenses/        CRUD route handlers (POST, GET, PATCH /[id], DELETE /[id])
    api/expenses/summary Monthly total + category breakdown endpoint
    api/auth/signout/    Sign-out route handler
    page.tsx             Dashboard (server component — fetches data directly via Supabase)
  components/
    auth/                LoginForm, SignupForm, SignOutButton
    dashboard/           MonthlyTotal, CategoryBreakdown, AddExpenseButton
    expenses/            ExpenseListSection, ExpenseList, ExpenseRow, filter, search, dialogs
    forms/               AmountInput, CategoryPicker, DateInput, NoteInput
    layout/              AppHeader, AuthShell
    ui/                  shadcn/ui primitives (button, dialog, input, etc.)
  lib/
    supabase/
      client.ts          Browser Supabase client (Client Components)
      server.ts          Cookie-bound server client (Route Handlers + Server Components)
    validation/
      expense.ts         Zod schemas for all API inputs
  middleware.ts          Auth redirect — unauthenticated requests to protected routes go to /login
supabase/
  migrations/
    0001_init_expenses.sql  Table, RLS policies, indexes, updated_at trigger
```

The dashboard server component queries Supabase directly (no internal API round-trip) so the request-scoped auth cookie resolves `auth.uid()` correctly inside RLS. All mutations (create, edit, delete) go through the Route Handlers.

---

## Deploying to Vercel

Connect the repository to a new Vercel project (Import from GitHub). Under **Project Settings > Environment Variables**, add the two variables from `.env.example`: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Vercel will detect Next.js automatically; no framework override or build command changes are needed. Every push to `main` triggers a production deploy; pull requests get isolated preview URLs.

---

## Testing

**Unit and component tests (no Supabase needed):**

```bash
npm run test:ci
```

199 tests pass; 1 test (RLS isolation) skips when `SUPABASE_TEST_URL` is not set — this is expected.

**End-to-end tests (Playwright — requires Supabase + dev server):**

Install browsers once:

```bash
npx playwright install
```

Then, with `npm run dev` running in a separate terminal:

```bash
npm run test:e2e
```

E2E tests require `E2E_SUPABASE_URL`, `E2E_TEST_USER_EMAIL`, and `E2E_TEST_USER_PASSWORD` set in `.env.local`. See `.env.test.example` for the full list.

**RLS isolation test (requires local Supabase emulator):**

```bash
SUPABASE_TEST_URL=http://localhost:54321 SUPABASE_TEST_ANON_KEY=<anon-key> npm run test:ci
```

This suite verifies that user A cannot read, update, delete, or forge-insert rows owned by user B. It runs cleanly when the env vars are present and skips when they are absent.

---

## Security model

- Row-Level Security is enabled on `public.expenses` from the first migration; every SELECT / INSERT / UPDATE / DELETE is gated on `auth.uid() = user_id`.
- The Supabase service-role key is intentionally not used by this application — RLS enforces all per-user authorization without requiring elevated privileges.
- All secrets are injected via environment variables; no credentials are hardcoded in source.
- Passwords are never handled by application code — Supabase Auth manages hashing, session JWTs, and refresh tokens.
- HTTPS everywhere via Vercel; session cookies are secure and HttpOnly.

---

## Development tooling (Claude Code)

This repo includes a `.claude/` orchestrator that drives the full SDLC via slash commands: `/plan → /jira → /adr → /ux → /develop → /cicd → /review → /demo`. Subagents in `.claude/agents/` handle each phase in isolation so the main context stays lean. Plugins and MCP servers are declared in `.claude/settings.json` and `.mcp.json` and install on first launch.

**First-run setup per contributor:**

1. Open the project in Claude Code. Accept the marketplace + plugin trust prompts.
2. Accept the project MCP server prompts (Playwright, GitHub).
3. OAuth into your **own** Atlassian account when prompted (via the connector flow at claude.ai).
4. The first time you run `/jira`, it will prompt for your Atlassian site and Jira project, then save your selections to `.claude/config/jira-board.json`. **That file is gitignored** — every contributor maintains their own. The schema is shown in [`.claude/config/jira-board.example.json`](.claude/config/jira-board.example.json) for reference.
5. Subsequent `/jira` runs reuse your saved board silently. To switch boards later, run `/jira reconfigure`.

The same per-user pattern applies to the GitHub MCP (uses your PAT or OAuth, never the repo author's).
