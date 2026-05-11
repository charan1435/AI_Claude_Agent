---
description: Decompose plan into Jira Epic, Stories and Tasks via MCP
argument-hint: "(no arguments needed — reads plan-output.md)"
allowed-tools: Read, Write, Glob
---

# /jira — Decompose Plan into Jira Epic, Stories and Tasks

You are the JIRA phase.
Your only job is to create well-structured Jira tickets.
You do NOT write code. You do NOT make architectural decisions.

---

## Step 1 — Read prior context
Use the Read tool to load `.claude/context/plan-output.md`.

If file does not exist:
  Print: "⚠️  No plan found. Run /plan first."
  Stop immediately.

---

## Step 2 — Confirm Jira MCP is connected
You have access to the Jira MCP tool.
Use it to create all tickets in the Embla Jira workspace.
Assign every single ticket to the current user.

---

## Step 3 — Create Epic
Create one Epic covering the full project.
Use the epic name from plan-output.md.

Epic fields:
  Summary:     [epic name from plan]
  Description: [problem statement from plan]
  Assignee:    current user

---

## Step 4 — Create User Stories
Create one User Story per MUST and SHOULD feature from plan.
Format: "As a [user], I want to [action] so that [benefit]"

Story fields:
  Summary:     As a [user], I want to [action]
  Description: So that [benefit]
                Acceptance criteria:
                  - [criterion 1]
                  - [criterion 2]
  Epic link:   link to Epic created above
  Assignee:    current user

---

## Step 5 — Create Tasks and Subtasks
Break each Story into concrete engineering Tasks.
Each Task should be completable in under half a day.

Task naming examples:
  "Create products table migration with RLS"
  "Implement GET /api/products route"
  "Build ProductCard component"
  "Write Playwright e2e for checkout flow"

Task fields:
  Summary:     [task name]
  Story link:  link to parent Story
  Assignee:    current user

---

## Step 6 — Write output file
Save to .claude/context/jira-output.md

Format:
---
# Jira Output
generated: [timestamp]

## Epic
id:    PROJ-XX
title: [title]
url:   [url]

## Stories
- PROJ-XX: [title]
- PROJ-XX: [title]

## Tasks
- PROJ-XX: [title] (under PROJ-XX)
- PROJ-XX: [title] (under PROJ-XX)

## Commit Prefix Convention
All commits must start with the relevant ticket ID.
Example: PROJ-4: add products migration

---HANDOFF---
agent:     jira
completed: Epic + [N] Stories + [N] Tasks created
epic_id:   PROJ-XX
next:      Run /adr to generate architecture decisions
---END---
---

---

## Step 7 — Tell the user

Print:
"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ /jira complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Epic:    PROJ-XX — [title]
Stories: [count] created
Tasks:   [count] created
All tickets assigned to you.
Output:  .claude/context/jira-output.md

Handing off to /commit. Next phase after that: /adr
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"


## Step — Hand off to /commit (mandatory)

After the banner above, invoke the commit skill so the user reviews and
explicitly confirms before any change is committed or pushed:

  Skill(skill="commit")

Do NOT proceed to /adr or print any other "next step" message before
/commit returns. Project policy: no subagent or main command commits or
pushes on its own.
