# UX Output
generated: 2026-05-11
use_reference_screenshots: false
reference_files: []
styles_provided: false

---

## Aesthetic Direction — "The Ledger"
An editorial / personal-ledger aesthetic — warm off-white paper, deep ink, a single deep-ochre accent used sparingly (totals, primary CTA), hairline rules instead of cards-everywhere. The app should feel like a quiet, well-kept notebook rather than a fintech dashboard. This intentionally avoids: purple/blue SaaS gradients, chunky rounded cards, generic Inter/Roboto, and the "neon fintech" look.

Why this direction for this product: a personal expense tracker is a calm, introspective tool. The UI should feel confident and unhurried — large serif numerals for totals (the thing the user actually came for), monospace digits for the row-by-row list (tabular figures align cleanly), and uppercase tracked labels for categories (gives the ledger/notebook character).

## Design Tokens

| Token            | Value                    | Tailwind / usage                              |
|------------------|--------------------------|-----------------------------------------------|
| primary_colour   | `#B8722A` (deep ochre)   | accent — totals emphasis, primary button      |
| secondary_colour | `#1A1A1A` (ink)          | body text, primary buttons (variant)          |
| background       | `#F7F4EE` (warm paper)   | page background                               |
| surface          | `#FFFFFF`                | modal, elevated rows                          |
| muted            | `#6B6660` (warm grey)    | secondary text, labels                        |
| hairline         | `#E6E0D5`                | dividers, input borders                       |
| danger           | `#8B2A2A` (oxblood)      | delete confirm action                         |
| display font     | **Newsreader** (Google)  | totals, page titles, modal titles             |
| body / UI font   | **IBM Plex Sans**        | labels, inputs, buttons, navigation           |
| numeric font     | **IBM Plex Mono**        | amounts in the list (tabular figures)         |
| border_radius    | `2px` (sharp)            | `rounded-sm` only — no `rounded-2xl`          |
| shadow           | hairline-first           | hairlines for sections; modal gets soft `lg`  |

Tailwind config additions (planned, not implemented here):
- `fontFamily.display = ['Newsreader', 'serif']`
- `fontFamily.sans = ['IBM Plex Sans', 'system-ui', 'sans-serif']`
- `fontFamily.mono = ['IBM Plex Mono', 'ui-monospace']`
- Custom colors under `colors.paper`, `colors.ink`, `colors.ochre`, `colors.hairline`.

Page-load motion: staggered reveal on the dashboard — monthly total fades up (180ms) → category bars wipe left-to-right (240ms, 60ms stagger) → list rows fade in (40ms stagger). Respect `prefers-reduced-motion`.

---

## Screens

| Screen          | Path        | Purpose                                                                 |
|-----------------|-------------|-------------------------------------------------------------------------|
| Sign in         | `/login`    | Existing user signs in with email + password.                           |
| Sign up         | `/signup`   | New user creates an account (email + password + confirm).               |
| Dashboard       | `/`         | Monthly total, category breakdown, full expense list with filter+search.|
| Add expense     | modal       | Triggered from dashboard; creates a new expense.                        |
| Edit expense    | modal       | Triggered from a row's overflow menu; updates an expense.               |
| Delete confirm  | modal       | Destructive confirm dialog before delete.                               |

Unauthenticated access to `/` is redirected to `/login` by middleware. Successful signup or login routes to `/`.

---

## Wireframes

### `/login` (and `/signup` is the same shape with a "confirm password" row)
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                  ─── L E D G E R ───                        │
│              a quiet place for your money                   │
│                                                             │
│         ┌───────────────────────────────────────┐           │
│         │  Email                                │           │
│         │  ┌─────────────────────────────────┐  │           │
│         │  │ you@example.com                 │  │           │
│         │  └─────────────────────────────────┘  │           │
│         │                                       │           │
│         │  Password                             │           │
│         │  ┌─────────────────────────────────┐  │           │
│         │  │ ••••••••••                      │  │           │
│         │  └─────────────────────────────────┘  │           │
│         │                                       │           │
│         │  ┌─────────────────────────────────┐  │           │
│         │  │           sign in               │  │  (ochre)  │
│         │  └─────────────────────────────────┘  │           │
│         │                                       │           │
│         │  new here?  ── create an account ──   │           │
│         └───────────────────────────────────────┘           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```
- Centered, narrow column (max-w-md). No card chrome — just hairline rules above and below the form group. Inline server-side error appears in oxblood above the submit button.

### `/` — Dashboard (single page, dashboard + list combined)
```
┌──────────────────────────────────────────────────────────────────────────┐
│  Ledger                                          May 2026   ·  sign out  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   this month                                                             │
│                                                  ┌────────────────────┐  │
│   $1,247.30                                      │   +  add expense   │  │
│                                                  └────────────────────┘  │
│   ─────────────────────────────────────────────────────────────────      │
│                                                                          │
│   FOOD              TRANSPORT         BILLS              OTHER           │
│   $412.50           $189.00           $560.00            $85.80          │
│   ▓▓▓▓▓▓▓▓▓▓        ▓▓▓▓▓             ▓▓▓▓▓▓▓▓▓▓▓▓▓▓     ▓▓              │
│   33 %              15 %              45 %               7 %             │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Recent                                                                 │
│                                                                          │
│   [ all ]  [ food ]  [ transport ]  [ bills ]  [ other ]                 │
│   ┌────────────────────────────────────────────┐                         │
│   │  🔍  search notes...                       │                         │
│   └────────────────────────────────────────────┘                         │
│                                                                          │
│   ──────────────────────────────────────────────────────────────         │
│   May 11   FOOD        $24.50    coffee + bagel                  ⋯       │
│   ──────────────────────────────────────────────────────────────         │
│   May 10   TRANSPORT   $18.00    uber home                       ⋯       │
│   ──────────────────────────────────────────────────────────────         │
│   May 09   BILLS       $560.00   rent                            ⋯       │
│   ──────────────────────────────────────────────────────────────         │
│   May 08   FOOD        $42.00    groceries                       ⋯       │
│   ──────────────────────────────────────────────────────────────         │
│   ...                                                                    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```
- The total is the visual hero — Newsreader, ~64px, ink-coloured. The "this month" label above it is IBM Plex Sans, uppercase, tracked, muted.
- Category breakdown is four columns. Bar uses ochre at 50% opacity for non-dominant categories and full ochre for the largest category of the month — a single touch of emphasis.
- Filter is a horizontal pill row; the active pill is ink-on-paper with a hairline outline; inactive pills are muted-on-paper. Search is a thin underlined input (no box border, just a bottom hairline) to keep the editorial feel.
- Row layout: `date · CATEGORY · AMOUNT (mono, right-aligned) · note (truncated) · ⋯ menu`. Hairline between rows; no zebra striping.
- Empty state replaces the list (and zeroes the total + breakdown): "no expenses yet. add your first to start your ledger." with the add-expense button as the only CTA.

### Add / Edit expense (Dialog)
```
┌─────────────────────────────────────────────┐
│  Add expense                            ✕   │
│  ──────────────────────────────────────     │
│                                             │
│  AMOUNT                                     │
│  ┌──────────────────────────────────────┐   │
│  │  $   0.00                            │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  CATEGORY                                   │
│  ( food )  ( transport )  ( bills )         │
│  ( other )                                  │
│                                             │
│  DATE                                       │
│  ┌──────────────────────────────────────┐   │
│  │  2026-05-11                       📅 │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  NOTE  (optional)                           │
│  ┌──────────────────────────────────────┐   │
│  │                                      │   │
│  │                                      │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  ────────────────────────────────────────   │
│  [ cancel ]                    [  save  ]   │
└─────────────────────────────────────────────┘
```
- Modal title in Newsreader. Field labels uppercase + tracked + muted.
- Category is a segmented pill control; exactly one selected at a time; defaults to `Food`.
- Date defaults to today (user local).
- Validation surfaces inline below each field in oxblood; submit stays disabled until amount > 0 and category chosen.
- Edit modal is the same shape, prefilled, with title "Edit expense" and the submit labelled "save changes".

### Delete confirm
```
┌─────────────────────────────────────────────┐
│  Delete this expense?                       │
│  This cannot be undone.                     │
│  ──────────────────────────────────────     │
│                                             │
│  $24.50  ·  FOOD  ·  May 11                 │
│  coffee + bagel                             │
│                                             │
│  ────────────────────────────────────────   │
│  [ cancel ]                  [ delete ]     │  ← delete = oxblood
└─────────────────────────────────────────────┘
```

---

## Component Tree

```
app/
  layout.tsx                  — fonts (Newsreader, IBM Plex Sans/Mono), Toaster, html theming
  page.tsx                    — / (dashboard, server component)
  login/page.tsx              — sign-in screen
  signup/page.tsx             — sign-up screen
  middleware.ts               — redirect unauthenticated → /login

components/
  layout/
    AppHeader.tsx             — brand, current-month label, sign-out
    AuthShell.tsx             — centered max-w-md column for /login + /signup

  dashboard/
    MonthlyTotal.tsx          — large Newsreader total + "this month" label
    CategoryBreakdown.tsx     — 4-column block with bar + amount + %
    DashboardSection.tsx      — wraps total + breakdown with hairlines

  expenses/
    ExpenseListSection.tsx    — wraps filter, search, list, empty state
    ExpenseList.tsx           — server-rendered list of rows
    ExpenseRow.tsx            — single row + overflow menu
    ExpenseFilter.tsx         — category pill group (URL-synced)
    ExpenseSearch.tsx         — debounced text search (URL-synced)
    ExpenseFormDialog.tsx     — Add / Edit modal (controlled, accepts mode + initialValues)
    DeleteExpenseDialog.tsx   — destructive confirm dialog
    AddExpenseButton.tsx      — primary CTA on dashboard header
    EmptyState.tsx            — "no expenses yet" state

  forms/
    AmountInput.tsx           — currency-prefixed number input, IBM Plex Mono
    CategoryPicker.tsx        — segmented pill group bound to react-hook-form
    DateInput.tsx             — date input (browser-native for MVP)
    NoteInput.tsx             — textarea

  auth/
    LoginForm.tsx             — react-hook-form, calls Supabase signInWithPassword
    SignupForm.tsx            — react-hook-form, calls Supabase signUp
    SignOutButton.tsx         — POST to /auth/signout, redirect

  ui/  (shadcn/ui base — installed, do not recreate)
    button, input, label, textarea, dialog, alert-dialog, dropdown-menu,
    toast (Sonner), separator, badge, skeleton
```

---

## Key Interactions

- **Unauthenticated visit to `/`** → middleware redirects to `/login`.
- **Login submit** → Supabase `signInWithPassword` → on success: `router.refresh()` + push `/`. On failure: oxblood inline error.
- **Signup submit** → Supabase `signUp` → on success: push `/` (or `/login` with a confirm-email banner if email confirmation is enabled). On failure: inline error.
- **Sign out** → POST to a Route Handler that clears the session → redirect `/login`.

- **Click `+ add expense`** → `ExpenseFormDialog` opens (empty, mode=create).
- **Submit add form** → `POST /api/expenses` → on 200: close dialog, toast "expense added", `router.refresh()` so the dashboard server component re-fetches total + breakdown + list. On 4xx: inline field errors.
- **Click row `⋯` → Edit** → `ExpenseFormDialog` opens (prefilled, mode=edit).
- **Submit edit** → `PATCH /api/expenses/[id]` → close, toast "expense updated", refresh.
- **Click row `⋯` → Delete** → `DeleteExpenseDialog` opens with the row's summary.
- **Confirm delete** → `DELETE /api/expenses/[id]` → close, toast "expense deleted", refresh.

- **Click a category filter pill** → updates `?category=food` in URL → server re-renders the list scoped to that category. Total and breakdown remain whole-month.
- **Type in search** → debounced 250ms → updates `?q=...` in URL → server re-renders list with `ILIKE %q%` on `note`.
- **Filter + search compose** (both can be active simultaneously). "all" filter pill clears the category constraint.

- **Loading**: per-section skeleton (mono dashes for total, hairline bars for breakdown, three skeleton rows for list).
- **Reduced motion**: stagger animations disabled; rows snap in.

---

---HANDOFF---
agent:              ux
completed:          wireframes produced, design tokens defined, component plan written
use_reference:      false
reference_files:    none
styles_provided:    false (defaults selected: editorial "Ledger" aesthetic — paper + ink + ochre, Newsreader + IBM Plex Sans + IBM Plex Mono, hairline-first layout)
screens:            6 (login, signup, dashboard, add modal, edit modal, delete modal)
components:         ~22 components planned across layout / dashboard / expenses / forms / auth
next:               Run /develop — frontend subagent must match these wireframes, tokens, and motion notes
---END---
