# CI/CD Output
generated: 2026-05-12

## Files generated

| File                                       | Purpose                                                              |
|--------------------------------------------|----------------------------------------------------------------------|
| `.github/workflows/ci.yml`                 | Lint + typecheck + Jest tests + Playwright e2e + build on push/PR    |
| `.github/workflows/preview.yml`            | Vercel preview deploy on PR + PR comment with preview URL            |
| `.github/workflows/deploy.yml`             | Supabase migration + Vercel production deploy on merge to `main`     |
| `.github/pull_request_template.md`         | Jira ticket field + checklist (RLS, secrets, tests, env.example, UI) |

## Pipeline shape

CI (`ci.yml`)
  job 1  lint-typecheck    → ESLint + `tsc --noEmit`
  job 2  test (needs 1)    → `npm run test -- --coverage` + upload coverage artifact
                             + `playwright install chromium` + `npm run test:e2e`
                             + upload playwright-report on failure
  job 3  build (needs 2)   → `npm run build`

Preview (`preview.yml`)
  runs on every PR → `amondnet/vercel-action@v25` (preview) → posts URL as PR comment

Production (`deploy.yml`)
  runs on push to `main` → `npx supabase db push` (with SUPABASE_ACCESS_TOKEN + SUPABASE_DB_PASSWORD)
                        → `amondnet/vercel-action@v25 --prod`

## Required GitHub Secrets

Set these in **Settings → Secrets and variables → Actions** on the GitHub repo:

| Secret                          | Where to get it                                              |
|---------------------------------|--------------------------------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project → Settings → API → Project URL              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API → anon public key          |
| `SUPABASE_ACCESS_TOKEN`         | https://supabase.com/dashboard/account/tokens                |
| `SUPABASE_DB_PASSWORD`          | The DB password you set when creating the Supabase project   |
| `VERCEL_TOKEN`                  | https://vercel.com/account/tokens                            |
| `VERCEL_ORG_ID`                 | `vercel link` then read `.vercel/project.json` `orgId`       |
| `VERCEL_PROJECT_ID`             | `vercel link` then read `.vercel/project.json` `projectId`   |

The service-role key is intentionally not in this list — RLS handles authorization.

## Recommendations carried forward from /develop

These were flagged by the deploy phase but are not yet wired into CI:

- **RLS isolation test (`src/__tests__/rls/rls-isolation.test.ts`) does not run in CI** as-is. It is gated behind `SUPABASE_TEST_URL` and `SUPABASE_TEST_ANON_KEY`. To run it in CI you would need either (a) a long-lived dedicated test Supabase project with two seed users, or (b) `supabase start` (local stack) added as a CI step. Out of scope for this `/cicd` pass — track for a follow-up.
- **Playwright e2e tests need real Supabase data** for most flows; `auth-redirect.spec.ts` is the only suite that runs without env. As-is, CI will execute the full e2e suite using the secrets `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` already wired in — point those at a dedicated test project, not production.

---HANDOFF---
agent:     cicd
completed: ci.yml + preview.yml + deploy.yml + pull_request_template.md
secrets:   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_ACCESS_TOKEN, SUPABASE_DB_PASSWORD, VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID
next:      Run /review for self-review and QA pass
---END---
