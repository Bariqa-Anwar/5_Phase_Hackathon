---
id: 014
title: Fix sidebar Tasks link 404 error
stage: green
date: 2026-02-07
surface: agent
model: claude-opus-4-6
feature: 002-frontend-better-auth
branch: 002-frontend-better-auth
user: shaheer
command: direct-prompt
labels: ["sidebar", "navigation", "404", "routing"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - frontend/components/layout/Sidebar.tsx
tests:
  - Tasks link href changed from /dashboard/tasks to /dashboard
  - Dashboard link still points to /dashboard
  - Both links use unique key (item.label) to avoid React key collision
  - Active state logic simplified to exact pathname match
---

## Prompt

The 'Tasks' button in the sidebar is causing a 404 error. Please fix this without disrupting any existing Task CRUD or Auth logic. Change its href from "/tasks" to "/dashboard". Verify that the 'Dashboard' link also points to "/dashboard".

## Response snapshot

The Tasks sidebar link pointed to `/dashboard/tasks` which has no corresponding page file — only `app/(dashboard)/dashboard/page.tsx` exists. Changed href to `/dashboard`. Also fixed the React `key` prop (was `item.href`, now `item.label`) to avoid duplicate keys, and simplified the active-state logic to an exact pathname match.

## Outcome

- Impact: Both sidebar links now navigate to the working dashboard page with full task CRUD
- Tests: Verified href values and key uniqueness in final file
- Files: 1 file modified (Sidebar.tsx)
- Next prompts: null
- Reflection: When a page route doesn't exist, fix the link rather than creating a redundant page

## Evaluation notes (flywheel)

- Failure modes observed: Sidebar link to non-existent route caused 404
- Graders run and results (PASS/FAIL): Code review PASS
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): null
