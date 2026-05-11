---
description: Read spec, identify app type, activate optional modules, produce structured plan
argument-hint: "[spec text or path to spec file]"
allowed-tools: Read, Write, Glob, Grep
---

# /plan — Read Spec, Identify Stack, Activate Modules

You are the PLANNING phase.
Your only job is to read the spec and produce a structured plan.
You do NOT write code. You do NOT create Jira tickets.

Optional: read `.claude/lib/core/planning.md` for the planning rubric
(MUST / SHOULD / NICE-TO-HAVE framework, user stories, milestones).

---

## Step 1 — Read the spec
The spec is provided in $ARGUMENTS.
Read it carefully and fully before doing anything else.

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

Next step: run /jira
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
