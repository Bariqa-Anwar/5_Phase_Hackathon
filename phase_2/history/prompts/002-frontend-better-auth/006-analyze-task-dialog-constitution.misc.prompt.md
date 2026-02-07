---
id: 006
title: Analyze Task Dialog Constitution Compliance
stage: misc
date: 2026-02-06
surface: agent
model: claude-opus-4-6
feature: 002-frontend-better-auth
branch: 002-frontend-better-auth
user: shaheer
command: /sp.analyze
labels: ["analysis", "constitution", "US3", "api-client", "code-duplication"]
links:
  spec: specs/002-frontend-better-auth/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/002-frontend-better-auth/spec.md
  - specs/002-frontend-better-auth/plan.md
  - specs/002-frontend-better-auth/tasks.md
  - .specify/memory/constitution.md
  - frontend/lib/api-client.ts
  - frontend/lib/hooks/useTasks.ts
  - frontend/app/api/auth/token/route.ts
tests:
  - N/A (read-only analysis, no code changes)
---

## Prompt

Verify that the new Task Dialog follows the project constitution and correctly utilizes the centralized api-client.ts without code duplication.

## Response snapshot

Ran /sp.analyze across spec.md, plan.md, tasks.md, and constitution.md. Produced structured analysis report with 14 findings:

- **2 CRITICAL**: (1) Constitution mandates TDD but tasks.md skips all automated tests. (2) Spec Session entity describes direct JWT storage but actual implementation uses cookie-based Better Auth session + token bridge.
- **3 HIGH**: Plan.md has stale code samples — token bridge not documented, project structure lists separate page instead of modal, api-client getAuthHeader() sample is outdated.
- **6 MEDIUM**: React version drift (18 vs 19), validation conflict (real-time vs on-blur), useTasks missing mutation methods, global 401 handler gap, phantom ProtectedRoute/Footer components.
- **2 LOW**: Terminology ambiguity in Out of Scope, optimistic UI mechanism missing from hook.

**Key finding for US3**: api-client.ts is correctly centralized. CreateTaskDialog should import `api` from `@/lib/api-client` and call `api.tasks.create()`. No code duplication risk. The centralized JWT injection via token bridge handles auth automatically.

Coverage: 94% of functional requirements have associated tasks. US3 tasks T056-T066 map cleanly to FR-014, FR-015, FR-018, FR-019, FR-020, FR-021, FR-022, FR-031.

## Outcome

- ✅ Impact: Identified 2 critical, 3 high, 6 medium, 2 low issues across spec/plan/tasks
- 🧪 Tests: N/A (read-only analysis)
- 📁 Files: 0 modified (analysis only)
- 🔁 Next prompts: Resolve C1 (TDD waiver or add tests), then proceed to US3 implementation
- 🧠 Reflection: Plan.md has significant staleness after the token bridge implementation. The auth architecture diverged from plan but implementation is correct. Plan should be updated post-feature.

## Evaluation notes (flywheel)

- Failure modes observed: Plan-to-code drift is highest risk area — 3 stale code samples could mislead future implementers
- Graders run and results (PASS/FAIL): Constitution alignment FAIL on TDD, WARN on spec-driven (plan staleness)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Fix D1 (FR-002 real-time → on-blur) as smallest remediation
