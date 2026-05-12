---
description: Read spec, identify app type, activate optional modules, produce structured plan
argument-hint: "[spec text | path to spec file (.md/.txt/.pdf/.docx)]"
allowed-tools: Read, Write, Glob, Grep
model: claude-opus-4-7
---

# /plan — Read Spec, Identify Stack, Activate Modules

ultrathink

You are the PLANNING phase. Operate as a deliberate, planning-mode agent:
think deeply before you write, evaluate trade-offs explicitly, and only
emit the structured plan once you have a high-confidence picture of the
spec, stack fit, and risks.

Your only job is to read the spec and produce a structured plan.
You do NOT write code. You do NOT create Jira tickets.

Optional: read `.claude/lib/core/planning.md` for the planning rubric
(MUST / SHOULD / NICE-TO-HAVE framework, user stories, milestones).

---

## Step 0 — Announce active model (sanity check)

Before doing anything else, print exactly one line so the user can verify
the model pin took effect:

  `▶ /plan running on: <model id from your runtime, e.g. claude-opus-4-7>`

Use the actual model identifier from your current runtime — do not
hardcode a value. If you cannot determine the model id, print
`▶ /plan running on: unknown (model pin may not be honored)` so the
user knows to check with `/model`.

---

## Step 1 — Resolve and read the spec

`$ARGUMENTS` may be one of:
  a) Inline spec text pasted by the user.
  b) A path to a spec file (e.g. `./docs/spec.md`, `specs/project.txt`,
     `C:\Users\me\spec.pdf`). Path may be relative or absolute, with
     forward or back slashes.

Resolution rules:
  1. If `$ARGUMENTS` is empty, ask the user to provide either the spec
     text or a path to a spec document, then stop until they reply.
  2. Trim whitespace and surrounding quotes from `$ARGUMENTS`.
  3. Treat `$ARGUMENTS` as a path candidate when it looks like a path
     (contains `/` or `\`, ends in `.md`, `.txt`, `.markdown`, `.rst`,
     `.pdf`, `.docx`, or starts with `./`, `../`, `~`, a drive letter,
     or `/`). Otherwise treat it as inline text.
  4. For a path candidate:
       - Use `Read` to load the file. For `.pdf`, pass `pages` if the
         document is large (>10 pages); start with `pages: "1-20"` and
         iterate further pages only if Step 2 onward still has gaps.
       - If `Read` fails (file not found), fall back to `Glob` to find
         likely matches (`**/*spec*.md`, `**/*requirements*.md`,
         `**/*brief*.md`) and ask the user to confirm before proceeding.
       - Record the resolved absolute path; reference it in the output.
  5. For inline text, treat `$ARGUMENTS` itself as the spec body.

Read the spec carefully and fully before doing anything else. If the
spec is ambiguous or missing a section that downstream steps need
(features, users, constraints), capture the gap in Step 6 as an
assumption or risk — do not invent requirements.

---

## Step 2 — Identify the application type
Determine what category this project belongs to:
  - E-commerce (products, cart, checkout, orders)
  - SaaS dashboard (accounts, subscriptions, analytics)
  - Booking / scheduling system
  - Social / community platform
  - Internal tool / admin panel
  - Content / blog / media platform
  - Other — describe clearly

---

## Step 3 — Identify required optional modules
Scan the spec for these signals and activate matching modules:

  SIGNAL IN SPEC                            MODULE
  ──────────────────────────────────────────────────────────
  payment / checkout / purchase /
  subscription / billing / invoice       → payments.md (Stripe)

  cart / wishlist / multi-step /
  wizard / complex shared state          → state-mgmt.md (Zustand)

  live / real-time / notifications /
  chat / feed / collaborative            → realtime.md

  upload / image / file /
  attachment / avatar / media            → file-upload.md

  email / confirmation / welcome /
  notification / invite / reset          → email.md (Resend)

  Google login / OAuth / social /
  GitHub login / SSO                     → auth-social.md

For each activated module state WHY it was activated
(quote the signal from the spec).

---

## Step 4 — Define core features
List every feature the spec requires.
Prioritise as: MUST / SHOULD / NICE-TO-HAVE
Keep each feature as one clear sentence.

---

## Step 5 — Define user journeys
List the 2-4 most important user journeys end to end.
Example: "Guest browses products → adds to cart → checks out → receives confirmation"

---

## Step 6 — Identify risks and assumptions
List anything unclear, ambiguous, or risky.
List assumptions you are making where spec is silent.

---

## Step 7 — Confirm stack
Core stack is always:
  Frontend:  Next.js 14 App Router + TypeScript
  UI:        Tailwind CSS + shadcn/ui
  Database:  Supabase PostgreSQL
  Auth:      Supabase Auth
  Storage:   Supabase Storage
  Deploy:    Vercel
  CI/CD:     GitHub Actions
  Tickets:   Jira

Add optional stack items based on activated modules:
  payments.md    → add Stripe
  state-mgmt.md  → add Zustand
  realtime.md    → add Supabase Realtime
  file-upload.md → add Supabase Storage (confirm enabled)
  email.md       → add Resend
  auth-social.md → add Supabase OAuth providers

---

## Step 8 — Write output file
Save complete plan to .claude/context/plan-output.md

Use this exact format:
---
# Plan Output
generated: [timestamp]
command: /plan
spec_source: [absolute path to spec file, or "inline ($ARGUMENTS)"]

## App Type
[identified type]

## Problem Statement
[one paragraph]

## Core Features
MUST:
  - [feature]
SHOULD:
  - [feature]
NICE-TO-HAVE:
  - [feature]

## User Journeys
1. [journey]
2. [journey]

## Activated Optional Modules
  - [module]: activated because spec mentions "[quote]"

## Stack
  Core: Next.js 14, Supabase, Vercel, GitHub Actions
  Optional: [additions from modules]

## Suggested Jira Epic Name
[name]

## Milestones
  1. [milestone]
  2. [milestone]

## Risks and Assumptions
  - [item]

---HANDOFF---
agent:     planning
completed: spec analysed, plan produced
modules:   [list of activated optional modules]
epic:      [suggested epic name]
next:      Run /jira to create Jira Epic, Stories and Tasks
---END---
---

---

## Step 9 — Tell the user

Print:
"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ /plan complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
App type:  [type]
Features:  [count] identified
Modules:   [list activated]
Output:    .claude/context/plan-output.md

Handing off to /commit so you can review and commit the plan output...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

## Step 10 — Hand off to /commit (mandatory)

Invoke the commit skill so the user can review the new plan-output.md and
commit it under their explicit confirmation:

  Skill(skill="commit")

Do NOT skip this step. Do NOT print "next step: run /jira" before /commit
returns. The /commit flow will surface the pending changes, propose commit
messages, and ask the user whether to commit and whether to push.

After /commit returns, then tell the user:
  "Next phase: run /jira"
