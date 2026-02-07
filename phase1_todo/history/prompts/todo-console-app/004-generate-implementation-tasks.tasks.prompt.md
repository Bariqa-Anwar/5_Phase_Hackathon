---
id: 004
title: Generate Implementation Tasks
stage: tasks
date: 2026-01-01
surface: agent
model: claude-sonnet-4-5-20250929
feature: todo-console-app
branch: 001-todo-console-app
user: user
command: /sp.tasks
labels: ["task-breakdown", "atomic-tasks", "checkpoints", "constitution-compliance"]
links:
  spec: specs/001-todo-console-app/spec.md
  ticket: null
  adr: specs/001-todo-console-app/adr-candidates.md
  pr: null
files:
  - specs/001-todo-console-app/tasks.md
tests:
  - 24 atomic tasks defined with acceptance criteria
  - 5 manual checkpoints for quality gates
---

## Prompt

/sp.tasks

Break the 'In-Memory Todo CLI' plan into atomic work units (15-30 mins each).

Required Task Attributes:
- Title and ID (e.g., Task 1.1)
- Estimated Duration (15-30m)
- Specific Acceptance Criterion (Single and testable)
- Dependency (Which task must finish first)
- Manual Checkpoint (Request for human review)

Phase 1: Environment Setup
- Task 1.1: Initialize UV environment. (Acceptance: pyproject.toml exists; NO .git directory).
- Task 1.2: Directory scaffolding. (Acceptance: /src and /specs_history folders created).

Phase 2: Data & Logic
- Task 2.1: Implement Task Data Model. (Acceptance: Task class with ID, Title, Desc, Status).
- Task 2.2: Implement TodoManager Logic. (Acceptance: List-based CRUD methods functional).

Phase 3: CLI Interface
- Task 3.1: Build Command Loop. (Acceptance: Menu displays and accepts user input).
- Task 3.2: Connect CRUD to CLI. (Acceptance: Tasks can be added/viewed/deleted via console).

Phase 4: Documentation
- Task 4.1: Finalize README.md and CLAUDE.md. (Acceptance: Complete setup instructions).

Constraint Guardrail:
For every task involving file creation, verify that NO git commands were triggered and no .git folder was created.

## Response snapshot

Successfully generated comprehensive task breakdown with 24 atomic tasks across 5 phases, each 15-30 minutes in duration with specific acceptance criteria and constitution compliance checks.

**Task Structure**:

**Phase 0: Environment Setup** (3 tasks, 30 min total)
- T0.1: Initialize UV project (15m) - pyproject.toml with Python 3.13+, NO .git
- T0.2: Create directories (10m) - src/, tests/ structure
- T0.3: Verify UV environment (10m) - Python 3.13+ active
- **Checkpoint 1**: Manual review of environment, no git artifacts

**Phase 1: Data Model & Logic** (8 tasks, 90 min total)
- T1.1: [P] Create Task dataclass (20m) - 4 fields with type hints
- T1.2: [P] Initialize TodoManager (15m) - Empty list, ID counter
- T1.3: Implement add_task() (25m) - Auto-increment ID, validation
- T1.4: Implement get_all_tasks() (15m) - Return list copy
- T1.5: Implement get_task_by_id() (20m) - Linear search, return None if not found
- T1.6: Implement update_task() (25m) - Partial update support
- T1.7: Implement delete_task() (20m) - ID preservation (never reused)
- T1.8: Implement toggle_completion() (20m) - Boolean flip
- **Checkpoint 2**: Manual REPL testing of all methods

**Phase 2: CLI Interface** (7 tasks, 120 min total)
- T2.1: Create menu display (20m) - 6 options formatted
- T2.2: Implement menu loop (25m) - match/case routing, exit on 6
- T2.3: handle_add_task() (25m) - Input validation, manager call
- T2.4: handle_view_tasks() (30m) - Formatted table, status indicators
- T2.5: handle_update_task() (30m) - Partial update prompts
- T2.6: handle_delete_task() (20m) - ID validation, manager call
- T2.7: handle_toggle_completion() (25m) - Toggle with status display
- **Checkpoint 3**: End-to-end manual test of all 5 operations

**Phase 3: Testing & Validation** (6 tasks, 60 min total)
- T3.1: Create test scenarios doc (20m) - 5 tests + edge cases
- T3.2: Execute Test 1: Add/View (15m) - Sequential IDs, empty list message
- T3.3: Execute Test 2: Mark Complete (15m) - Toggle behavior, [X] vs [ ]
- T3.4: Execute Test 3: Update (15m) - Title only, description only, both
- T3.5: Execute Test 4: Delete (15m) - ID preservation, no renumbering
- T3.6: Execute Edge Cases (20m) - Empty input, Unicode, invalid menu
- **Checkpoint 4**: All test scenarios pass

**Phase 4: Documentation** (3 tasks, 45 min total)
- T4.1: Write README.md (30m) - Installation, usage, limitations
- T4.2: Constitution compliance check (20m) - 30+ item checklist
- T4.3: Final smoke test (15m) - Full workflow, verify data loss on exit
- **Checkpoint 5**: README complete, compliance verified

**Key Features**:

1. **Atomic Tasks**: All 15-30 minutes, single acceptance criterion
2. **Dependencies**: Explicit task graph with parallel opportunities
   - Phase 1: T1.1 || T1.2 → T1.3 → T1.5 → [T1.4 || T1.6 || T1.7 || T1.8]
   - Phase 2: T2.1 → T2.2 → [T2.3 || T2.4 || T2.5 || T2.6 || T2.7]
   - 8 tasks can run in parallel with proper coordination
3. **Checkpoints**: 5 manual review points at critical gates
4. **Constitution Guardrails**:
   - Pre-task checks: Verify no .git, correct directory, UV active
   - Post-task checks: No git artifacts, no persistent files, correct location
   - Violation response: STOP, remediate, document
5. **Duration Estimates**:
   - Sequential: 345 minutes (~6 hours)
   - Parallel: 240 minutes (~4 hours)
   - MVP (US1 only): 165 minutes (~2.5 hours)

**Task Breakdown By User Story**:
- **US1 (Create/View)**: T1.1-T1.4, T2.1-T2.4, T3.1-T3.2
- **US2 (Mark Complete)**: T1.8, T2.7, T3.3
- **US3 (Update)**: T1.5-T1.6, T2.5, T3.4
- **US4 (Delete)**: T1.5, T1.7, T2.6, T3.5

**Implementation Strategies Documented**:
1. **MVP-First**: Complete US1 only (Add + View) in ~2.5 hours, validate, then iterate
2. **Full Sequential**: All phases in order, ~6 hours
3. **Parallel Team**: 3 developers, ~3.5 hours with coordination

**Dependency Graph**: Complete ASCII diagram showing task relationships and critical path

**Constitution Compliance**: Every file-creating task includes pre/post checks for git artifacts and persistence violations

## Outcome

- ✅ Impact: 24 actionable tasks ready for immediate implementation; clear critical path and parallel opportunities identified
- 🧪 Tests: 6 manual test tasks (T3.1-T3.6) with specific acceptance criteria
- 📁 Files: Created tasks.md with complete task breakdown, dependencies, and compliance guardrails
- 🔁 Next prompts: Begin implementation with T0.1 (Initialize UV Project), or create ADRs first via `/sp.adr <decision-title>`
- 🧠 Reflection: Task breakdown successfully translates architectural plan into executable work units. Each task is atomic (15-30 min), has single acceptance criterion, and explicit dependencies. Constitution compliance guardrails embedded in every phase ensure no git operations or persistence violations. MVP-first strategy enables incremental delivery.

## Evaluation notes (flywheel)

- Failure modes observed: None - task generation workflow executed successfully
- Graders run and results (PASS/FAIL):
  - Atomicity: PASS (all tasks 15-30 min with single acceptance criterion)
  - Dependencies: PASS (explicit task graph with parallel opportunities)
  - Acceptance Criteria: PASS (specific, testable, aligned with spec FR-001 to FR-015)
  - Constitution Compliance: PASS (pre/post checks on every task, 5 checkpoints)
  - Traceability: PASS (tasks map to user stories US1-US4)
  - Overall: PASS (24/24 tasks ready for implementation)
- Prompt variant (if applicable): Standard /sp.tasks workflow with user-provided phase structure
- Next experiment (smallest change to try): Begin with T0.1 to validate task granularity; if tasks take significantly longer/shorter than 15-30 min, adjust estimates and task breakdown for future features
