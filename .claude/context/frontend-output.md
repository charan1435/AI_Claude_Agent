# Frontend Output
generated: 2026-05-11

## Pages Built

| Path | Description |
|------|-------------|
| `src/app/(auth)/login/page.tsx` | Sign-in page. Static, renders AuthShell + LoginForm. |
| `src/app/(auth)/signup/page.tsx` | Sign-up page. Static, renders AuthShell + SignupForm. |
| `src/app/page.tsx` | Dashboard. Server component. Fetches monthly summary + expense list directly via Supabase server client, passes data to client components. Reads `?category=` and `?q=` from searchParams. |
| `src/app/loading.tsx` | Dashboard loading skeleton (hairline pulse placeholders). |
| `src/app/error.tsx` | Dashboard error boundary with retry CTA. |
| `src/app/layout.tsx` | Root layout. Loads Newsreader + IBM Plex Sans + IBM Plex Mono via next/font/google. Mounts Sonner Toaster. |

## Components Built

### layout/
| Component | Description |
|-----------|-------------|
| `AppHeader.tsx` | Top bar with "Ledger" brand (Newsreader tracked caps), current month label, and SignOutButton. Hairline rule below. |
| `AuthShell.tsx` | Centered max-w-md column for /login and /signup. Ledger wordmark + tagline above; form group bounded by hairline rules top/bottom, no card chrome. |

### dashboard/
| Component | Description |
|-----------|-------------|
| `MonthlyTotal.tsx` | Visual hero: "this month" label (uppercase tracked muted) + Newsreader 64px total. Fade-up animation (180ms). |
| `CategoryBreakdown.tsx` | 4-column grid (2-col on mobile). Each column: CATEGORY label, formatted amount (IBM Plex Mono), ochre bar (wipe animation, 240ms + 60ms stagger), percentage. Dominant category gets full ochre; others ochre/50. |
| `AddExpenseButton.tsx` | Ochre primary button with + icon. Triggers ExpenseFormDialog. |

### expenses/
| Component | Description |
|-----------|-------------|
| `ExpenseListSection.tsx` | Client component hosting all dialog state (add/edit/delete), filter, search, list, and empty state. |
| `ExpenseList.tsx` | Renders list of ExpenseRow with `role="list"` semantics. |
| `ExpenseRow.tsx` | Single row: date · CATEGORY · amount (IBM Plex Mono tabular-nums, right-aligned) · note (truncated) · ⋯ overflow menu. Hairline border-bottom. Stagger fade-in (40ms delay per row). |
| `ExpenseFilter.tsx` | Category pill row (URL-synced via `?category=`). Active pill: ink bg, paper text. Inactive: muted text, hairline border. |
| `ExpenseSearch.tsx` | Debounced (250ms) search input. Bottom-hairline-only editorial style (no box border). Updates `?q=` URL param. |
| `ExpenseFormDialog.tsx` | Add/Edit modal. Inner form remounted via `key` per open state (no useEffect reset). Posts to API on submit. Oxblood field errors. |
| `DeleteExpenseDialog.tsx` | AlertDialog confirm. Shows expense summary. Oxblood delete button. DELETEs /api/expenses/[id]. |
| `EmptyState.tsx` | Shows when list is empty. Context-aware message for active filter vs no expenses. Includes "add expense" CTA when no filter active. |

### forms/
| Component | Description |
|-----------|-------------|
| `AmountInput.tsx` | $ prefix + number input in IBM Plex Mono. No spin buttons. Tabular-nums. |
| `CategoryPicker.tsx` | Segmented pill radio group. One selected at a time. Defaults to Food. |
| `DateInput.tsx` | Native browser date input. Defaults to today's ISO date. |
| `NoteInput.tsx` | Textarea with optional label. 500-char max. |

### auth/
| Component | Description |
|-----------|-------------|
| `LoginForm.tsx` | react-hook-form. Calls supabase.auth.signInWithPassword. On success: router.refresh() + push('/'). On error: oxblood inline message. |
| `SignupForm.tsx` | react-hook-form (email + password + confirmPassword). signUp. Session present → push '/'; absent → confirmation message. |
| `SignOutButton.tsx` | Plain text button. POSTs /api/auth/signout then router.push('/login') + refresh(). |

## API Integration

| Route | How Used |
|-------|---------|
| `GET /api/expenses/summary` | NOT called via fetch — dashboard server component queries Supabase directly for the monthly aggregate (avoids cookie-forwarding complexity). See note below. |
| `GET /api/expenses` | NOT called via fetch — dashboard server component queries Supabase directly for the list. |
| `POST /api/expenses` | ExpenseFormDialog (mode=create) submits JSON body. |
| `PATCH /api/expenses/[id]` | ExpenseFormDialog (mode=edit) submits partial JSON body. |
| `DELETE /api/expenses/[id]` | DeleteExpenseDialog confirms then DELETEs. |
| `POST /api/auth/signout` | SignOutButton calls this then redirects. |

**Note on summary + list routes**: The dashboard is a server component that already runs in the Supabase cookie-bound context. Calling `fetch('/api/expenses/summary')` from within a server component during SSR requires forwarding cookies manually. To keep it simple and correct (RLS sees auth.uid()), the dashboard queries Supabase directly. The `/api/expenses/summary` and `/api/expenses` routes remain available and will be used correctly by client components or external callers.

## Design Tokens Applied

### Fonts (CSS variables exposed via next/font)
- `--font-newsreader` → `font-display` class (Newsreader, 400/500/600, normal+italic)
- `--font-ibm-plex-sans` → `font-sans` class (IBM Plex Sans, 300/400/500/600)
- `--font-ibm-plex-mono` → `font-mono` class (IBM Plex Mono, 400/500)

### Colors (Tailwind v4 @theme → Tailwind utilities)
| Token | Hex | Tailwind utilities |
|-------|-----|--------------------|
| paper | `#F7F4EE` | `bg-paper`, `text-paper`, `border-paper` |
| ink | `#1A1A1A` | `bg-ink`, `text-ink` |
| ink-muted | `#6B6660` | `text-ink-muted`, `border-ink-muted` |
| ochre | `#B8722A` | `bg-ochre`, `text-ochre`, `ring-ochre` |
| hairline | `#E6E0D5` | `border-hairline`, `bg-hairline` |
| oxblood | `#8B2A2A` | `bg-oxblood`, `text-oxblood` |
| surface | `#FFFFFF` | `bg-surface` |

### Shadcn semantic tokens overridden to Ledger palette:
- `--primary` → ochre (#B8722A)
- `--destructive` → oxblood (#8B2A2A)
- `--background` → paper (#F7F4EE)
- `--foreground` → ink (#1A1A1A)
- `--border` / `--input` → hairline (#E6E0D5)
- `--ring` → ochre (#B8722A)
- `--radius` → 0.125rem (2px sharp)

### Animations
- `animate-fade-slide-up`: MonthlyTotal + CategoryBreakdown columns (180ms, staggered)
- `animate-bar-wipe`: Category bar fills (240ms + 60ms stagger)
- `animate-row-fade`: Expense rows (40ms stagger per row)
- All animations disabled under `prefers-reduced-motion: reduce`

## QA Agent Notes

### data-testid attributes placed
- `data-testid="login-form"` / `data-testid="login-submit"` / `data-testid="login-error"`
- `data-testid="signup-form"` / `data-testid="signup-submit"` / `data-testid="signup-error"` / `data-testid="signup-confirmation"`
- `data-testid="monthly-total"`
- `data-testid="category-breakdown"` + `data-testid="category-{food|transport|bills|other}"`
- `data-testid="add-expense-button"` / `data-testid="empty-add-expense"`
- `data-testid="expense-list-section"` / `data-testid="expense-list"` / `data-testid="expense-row"` / `data-testid="expense-row-menu"` / `data-testid="expense-edit"` / `data-testid="expense-delete"`
- `data-testid="expense-filter"` + `data-testid="filter-{all|food|transport|bills|other}"`
- `data-testid="expense-search"` / `data-testid="search-input"`
- `data-testid="expense-form-dialog"` / `data-testid="amount-input"` / `data-testid="date-input"` / `data-testid="note-input"` / `data-testid="category-picker"` / `data-testid="category-{food|transport|bills|other}"` / `data-testid="form-submit"` / `data-testid="form-cancel"` / `data-testid="form-server-error"`
- `data-testid="delete-expense-dialog"` / `data-testid="delete-confirm"`
- `data-testid="empty-state"`

### Dialog mechanics
- ExpenseFormDialog uses `@base-ui/react/dialog` (not Radix). Focus trap is built into base-ui. Verify with keyboard test.
- Inner form uses `key` prop for reset — the form unmounts and remounts each time the dialog opens. This means validation state clears cleanly.
- DeleteExpenseDialog uses `@base-ui/react/alert-dialog`. The `AlertDialogCancel` wraps a `Button variant="outline"`.

### Timezone
- Dashboard server component uses UTC for month boundaries. The summary query is done directly via Supabase (not the summary API route). The API route `/api/expenses/summary?tz=` still works correctly for client calls.
- If exact local-month totals are required for users in non-UTC timezones, a client component could re-fetch from `/api/expenses/summary?tz=<local>` and hydrate over the server-rendered total. This is a known MVP limitation — acceptable per spec.

### Middleware deprecation warning
- Next.js 16.x warns: "The middleware file convention is deprecated. Please use proxy instead." This is in the backend-created `src/middleware.ts` — do NOT modify it. The warning does not affect runtime behavior in the MVP.

### Known API contract gaps (not blocking, for QA awareness)
- The `GET /api/expenses/summary` route exists and works correctly. The frontend dashboard bypasses it intentionally (direct Supabase query in server component). QA should test the route independently.

## Screenshot Results
No reference screenshots provided (use_reference_screenshots: false per ux-output.md).
Visual design implemented from wireframes and design tokens in ux-output.md.
Build passes cleanly; screenshots require a running Supabase instance to populate data.

---HANDOFF---
agent:     frontend
completed: pages + components + design token system + stagger animations + accessibility
pages:     5 (/, /login, /signup, loading, error)
components: 22 components across layout/dashboard/expenses/forms/auth + 9 shadcn/ui primitives
screenshots: no reference provided; design faithfully implements Ledger wireframes + tokens
api_routes_consumed:
  - POST /api/expenses (ExpenseFormDialog create)
  - PATCH /api/expenses/[id] (ExpenseFormDialog edit)
  - DELETE /api/expenses/[id] (DeleteExpenseDialog)
  - POST /api/auth/signout (SignOutButton)
  - GET /api/expenses + GET /api/expenses/summary (bypassed — server component queries Supabase directly)
commits: PROJ-6, PROJ-7, PROJ-8, PROJ-9, PROJ-10
build:   npm run build — PASS
lint:    npm run lint — PASS (0 errors, 0 warnings)
typecheck: npm run typecheck — PASS
next: QA subagent should test:
  1. Auth flow (sign-up → confirm → login → dashboard → sign-out)
  2. CRUD flow (add → edit → delete expense, verify totals update)
  3. Filter + search compose (category pill + text search simultaneously)
  4. Empty state (no expenses, filtered empty, search empty)
  5. Field validation in ExpenseFormDialog (amount=0, missing category, missing date)
  6. Keyboard accessibility: tab order in dialogs, focus trap, Escape to close
  7. RLS isolation: verify user A cannot see user B's expenses
  8. Timezone: UTC month boundary vs local timezone edge case
---END---
