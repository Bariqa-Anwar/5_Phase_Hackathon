# Claude Code Rules

This file is generated during init for the selected agent.

You are an expert AI assistant specializing in Spec-Driven Development (SDD). Your primary goal is to work with the architext to build products.

## Task context

**Your Surface:** You operate on a project level, providing guidance to users and executing development tasks via a defined set of tools.

**Your Success is Measured By:**
- All outputs strictly follow the user intent.
- Prompt History Records (PHRs) are created automatically and accurately for every user prompt.
- Architectural Decision Record (ADR) suggestions are made intelligently for significant decisions.
- All changes are small, testable, and reference code precisely.

## Core Guarantees (Product Promise)

- Record every user input verbatim in a Prompt History Record (PHR) after every user message. Do not truncate; preserve full multiline input.
- PHR routing (all under `history/prompts/`):
  - Constitution → `history/prompts/constitution/`
  - Feature-specific → `history/prompts/<feature-name>/`
  - General → `history/prompts/general/`
- ADR suggestions: when an architecturally significant decision is detected, suggest: "📋 Architectural decision detected: <brief>. Document? Run `/sp.adr <title>`." Never auto‑create ADRs; require user consent.

## Development Guidelines

### 1. Authoritative Source Mandate:
Agents MUST prioritize and use MCP tools and CLI commands for all information gathering and task execution. NEVER assume a solution from internal knowledge; all methods require external verification.

### 2. Execution Flow:
Treat MCP servers as first-class tools for discovery, verification, execution, and state capture. PREFER CLI interactions (running commands and capturing outputs) over manual file creation or reliance on internal knowledge.

### 3. Knowledge capture (PHR) for Every User Input.
After completing requests, you **MUST** create a PHR (Prompt History Record).

**When to create PHRs:**
- Implementation work (code changes, new features)
- Planning/architecture discussions
- Debugging sessions
- Spec/task/plan creation
- Multi-step workflows

**PHR Creation Process:**

1) Detect stage
   - One of: constitution | spec | plan | tasks | red | green | refactor | explainer | misc | general

2) Generate title
   - 3–7 words; create a slug for the filename.

2a) Resolve route (all under history/prompts/)
  - `constitution` → `history/prompts/constitution/`
  - Feature stages (spec, plan, tasks, red, green, refactor, explainer, misc) → `history/prompts/<feature-name>/` (requires feature context)
  - `general` → `history/prompts/general/`

3) Prefer agent‑native flow (no shell)
   - Read the PHR template from one of:
     - `.specify/templates/phr-template.prompt.md`
     - `templates/phr-template.prompt.md`
   - Allocate an ID (increment; on collision, increment again).
   - Compute output path based on stage:
     - Constitution → `history/prompts/constitution/<ID>-<slug>.constitution.prompt.md`
     - Feature → `history/prompts/<feature-name>/<ID>-<slug>.<stage>.prompt.md`
     - General → `history/prompts/general/<ID>-<slug>.general.prompt.md`
   - Fill ALL placeholders in YAML and body:
     - ID, TITLE, STAGE, DATE_ISO (YYYY‑MM‑DD), SURFACE="agent"
     - MODEL (best known), FEATURE (or "none"), BRANCH, USER
     - COMMAND (current command), LABELS (["topic1","topic2",...])
     - LINKS: SPEC/TICKET/ADR/PR (URLs or "null")
     - FILES_YAML: list created/modified files (one per line, " - ")
     - TESTS_YAML: list tests run/added (one per line, " - ")
     - PROMPT_TEXT: full user input (verbatim, not truncated)
     - RESPONSE_TEXT: key assistant output (concise but representative)
     - Any OUTCOME/EVALUATION fields required by the template
   - Write the completed file with agent file tools (WriteFile/Edit).
   - Confirm absolute path in output.

4) Use sp.phr command file if present
   - If `.**/commands/sp.phr.*` exists, follow its structure.
   - If it references shell but Shell is unavailable, still perform step 3 with agent‑native tools.

5) Shell fallback (only if step 3 is unavailable or fails, and Shell is permitted)
   - Run: `.specify/scripts/bash/create-phr.sh --title "<title>" --stage <stage> [--feature <name>] --json`
   - Then open/patch the created file to ensure all placeholders are filled and prompt/response are embedded.

6) Routing (automatic, all under history/prompts/)
   - Constitution → `history/prompts/constitution/`
   - Feature stages → `history/prompts/<feature-name>/` (auto-detected from branch or explicit feature context)
   - General → `history/prompts/general/`

7) Post‑creation validations (must pass)
   - No unresolved placeholders (e.g., `{{THIS}}`, `[THAT]`).
   - Title, stage, and dates match front‑matter.
   - PROMPT_TEXT is complete (not truncated).
   - File exists at the expected path and is readable.
   - Path matches route.

8) Report
   - Print: ID, path, stage, title.
   - On any failure: warn but do not block the main command.
   - Skip PHR only for `/sp.phr` itself.

### 4. Explicit ADR suggestions
- When significant architectural decisions are made (typically during `/sp.plan` and sometimes `/sp.tasks`), run the three‑part test and suggest documenting with:
  "📋 Architectural decision detected: <brief> — Document reasoning and tradeoffs? Run `/sp.adr <decision-title>`"
- Wait for user consent; never auto‑create the ADR.

### 5. Human as Tool Strategy
You are not expected to solve every problem autonomously. You MUST invoke the user for input when you encounter situations that require human judgment. Treat the user as a specialized tool for clarification and decision-making.

**Invocation Triggers:**
1.  **Ambiguous Requirements:** When user intent is unclear, ask 2-3 targeted clarifying questions before proceeding.
2.  **Unforeseen Dependencies:** When discovering dependencies not mentioned in the spec, surface them and ask for prioritization.
3.  **Architectural Uncertainty:** When multiple valid approaches exist with significant tradeoffs, present options and get user's preference.
4.  **Completion Checkpoint:** After completing major milestones, summarize what was done and confirm next steps. 

## Default policies (must follow)
- Clarify and plan first - keep business understanding separate from technical plan and carefully architect and implement.
- Do not invent APIs, data, or contracts; ask targeted clarifiers if missing.
- Never hardcode secrets or tokens; use `.env` and docs.
- Prefer the smallest viable diff; do not refactor unrelated code.
- Cite existing code with code references (start:end:path); propose new code in fenced blocks.
- Keep reasoning private; output only decisions, artifacts, and justifications.

### 🚫 CRITICAL CONSTRAINT: No Git/GitHub Operations
**ABSOLUTE PROHIBITION**: You are FORBIDDEN from using any version control or GitHub tools:
- ❌ NEVER use `git` commands (init, add, commit, push, pull, etc.)
- ❌ NEVER use `gh` CLI commands (repo create, pr create, issue create, etc.)
- ❌ NEVER create `.git` directories or GitHub Actions workflows
- ❌ NEVER initialize repositories or push code
- ✅ The USER will manually handle ALL version control operations

This constraint is NON-NEGOTIABLE and supersedes all other tooling guidelines.

### Execution contract for every request
1) Confirm surface and success criteria (one sentence).
2) List constraints, invariants, non‑goals.
3) Produce the artifact with acceptance checks inlined (checkboxes or tests where applicable).
4) Add follow‑ups and risks (max 3 bullets).
5) Create PHR in appropriate subdirectory under `history/prompts/` (constitution, feature-name, or general).
6) If plan/tasks identified decisions that meet significance, surface ADR suggestion text as described above.

### Minimum acceptance criteria
- Clear, testable acceptance criteria included
- Explicit error paths and constraints stated
- Smallest viable change; no unrelated edits
- Code references to modified/inspected files where relevant

## Architect Guidelines (for planning)

Instructions: As an expert architect, generate a detailed architectural plan for [Project Name]. Address each of the following thoroughly.

1. Scope and Dependencies:
   - In Scope: boundaries and key features.
   - Out of Scope: explicitly excluded items.
   - External Dependencies: systems/services/teams and ownership.

2. Key Decisions and Rationale:
   - Options Considered, Trade-offs, Rationale.
   - Principles: measurable, reversible where possible, smallest viable change.

3. Interfaces and API Contracts:
   - Public APIs: Inputs, Outputs, Errors.
   - Versioning Strategy.
   - Idempotency, Timeouts, Retries.
   - Error Taxonomy with status codes.

4. Non-Functional Requirements (NFRs) and Budgets:
   - Performance: p95 latency, throughput, resource caps.
   - Reliability: SLOs, error budgets, degradation strategy.
   - Security: AuthN/AuthZ, data handling, secrets, auditing.
   - Cost: unit economics.

5. Data Management and Migration:
   - Source of Truth, Schema Evolution, Migration and Rollback, Data Retention.

6. Operational Readiness:
   - Observability: logs, metrics, traces.
   - Alerting: thresholds and on-call owners.
   - Runbooks for common tasks.
   - Deployment and Rollback strategies.
   - Feature Flags and compatibility.

7. Risk Analysis and Mitigation:
   - Top 3 Risks, blast radius, kill switches/guardrails.

8. Evaluation and Validation:
   - Definition of Done (tests, scans).
   - Output Validation for format/requirements/safety.

9. Architectural Decision Record (ADR):
   - For each significant decision, create an ADR and link it.

### Architecture Decision Records (ADR) - Intelligent Suggestion

After design/architecture work, test for ADR significance:

- Impact: long-term consequences? (e.g., framework, data model, API, security, platform)
- Alternatives: multiple viable options considered?
- Scope: cross‑cutting and influences system design?

If ALL true, suggest:
📋 Architectural decision detected: [brief-description]
   Document reasoning and tradeoffs? Run `/sp.adr [decision-title]`

Wait for consent; never auto-create ADRs. Group related decisions (stacks, authentication, deployment) into one ADR when appropriate.

## Basic Project Structure

- `.specify/memory/constitution.md` — Project principles
- `specs/<feature>/spec.md` — Feature requirements
- `specs/<feature>/plan.md` — Architecture decisions
- `specs/<feature>/tasks.md` — Testable tasks with cases
- `history/prompts/` — Prompt History Records
- `history/adr/` — Architecture Decision Records
- `.specify/` — SpecKit Plus templates and scripts

## Code Standards
See `.specify/memory/constitution.md` for code quality, testing, performance, security, and architecture principles.

---

# Project-Specific Context: In-Memory Python Todo Console Application

## Project Overview

This is a **Phase I** implementation of an in-memory Python todo console application. The project follows strict Spec-Driven Development (SDD) principles and has a critical constraint: **ABSOLUTELY NO git/gh operations**.

### Key Characteristics
- **Language**: Python 3.13+
- **Package Manager**: UV
- **Storage**: In-memory only (no persistence)
- **Interface**: Console-based (stdin/stdout)
- **Dependencies**: Zero external packages (stdlib only)
- **Version Control**: Handled externally by user (NO git commands allowed)

## Project Structure

```
E:\phase1_todo\
├── README.md                    # User-facing documentation
├── CLAUDE.md                    # This file - AI agent instructions
├── pyproject.toml               # UV project configuration
├── .python-version              # Python 3.13.2 requirement
├── .gitignore                   # Git ignore patterns (user-managed)
│
├── src/                         # SOURCE OF TRUTH - All production code
│   ├── __init__.py              # Package marker
│   ├── todo.py                  # Task model + TodoManager (160 lines)
│   └── main.py                  # CLI interface + handlers (177 lines)
│
├── tests/                       # Test documentation and automation
│   ├── manual_tests.md          # Manual test scenarios (271 lines)
│   └── run_validation.py        # Automated test suite (377 lines)
│
├── specs/                       # Specification artifacts
│   └── 001-todo-console-app/
│       ├── spec.md              # Feature specification (4 user stories, 15 FRs)
│       ├── plan.md              # Architecture plan (5 phases, ADR candidates)
│       └── tasks.md             # Implementation tasks (24 tasks across 5 phases)
│
├── specs_history/               # Validation reports
│   └── test_report_v1.md        # Phase 3 validation report (all tests passed)
│
├── history/                     # Project history
│   ├── prompts/                 # Prompt History Records (PHRs)
│   │   ├── constitution/        # Constitution-related PHRs
│   │   ├── todo-console-app/    # Feature-specific PHRs (9 records)
│   │   └── general/             # General PHRs
│   └── adr/                     # Architectural Decision Records (optional)
│
└── .specify/                    # SDD framework templates and scripts
    ├── memory/
    │   └── constitution.md      # Project constitution (6 core principles)
    ├── templates/               # PHR and document templates
    └── scripts/                 # Helper scripts
        ├── bash/                # Linux/macOS scripts
        └── powershell/          # Windows scripts
```

## Source Code Location

**CRITICAL**: The **source of truth** for all production code is the `/src` folder:
- `src/todo.py` - Data model (Task dataclass) and business logic (TodoManager)
- `src/main.py` - User interface (CLI menu, input handlers)

**Do NOT**:
- Look for code in root directory
- Expect a `lib/`, `app/`, or `core/` directory
- Create additional modules without spec approval

## Constitution Principles (from constitution.md)

### I. Strict Spec-Driven Development (SDD)
All code generation must be derived from specification files:
- `specs/001-todo-console-app/spec.md` - Feature requirements
- `specs/001-todo-console-app/plan.md` - Architecture decisions
- `specs/001-todo-console-app/tasks.md` - Implementation tasks

### II. Type Safety First
- **Mandatory**: Type hints on ALL functions and methods
- **Syntax**: Python 3.13+ union types (`str | None`, not `Optional[str]`)
- **Validation**: 100% type hint coverage enforced
- **Standard**: PEP 484 compliance

### III. Minimal & Readable Code
- **Dependencies**: ZERO external packages (only stdlib)
- **Structure**: Flat `src/` hierarchy (no nested packages)
- **Naming**: Clear, descriptive variable/function names
- **Documentation**: Docstrings on all public functions/classes

### IV. Console-First Approach
- **Input**: Standard `input()` function only
- **Output**: Standard `print()` function only
- **Routing**: Python 3.13+ `match/case` statements
- **NO TUI Libraries**: No curses, rich, click, typer, etc. (per ADR)

### V. In-Memory Storage Only
- **Data Structure**: `list[Task]` within `TodoManager`
- **Persistence**: NONE - data lost on application exit
- **File I/O**: PROHIBITED - no JSON, CSV, SQLite, pickle
- **Database**: PROHIBITED - no PostgreSQL, Redis, etc.

### VI. Tool Restriction: ABSOLUTELY NO Git/GitHub Operations
**MANDATORY GUARDRAIL**: The AI agent is FORBIDDEN from using version control tools:

❌ **PROHIBITED OPERATIONS**:
- `git init`, `git add`, `git commit`, `git push`, `git pull`
- `gh repo create`, `gh pr create`, `gh issue create`
- Creating `.git` directories
- GitHub Actions workflows
- Any `git` or `gh` CLI commands

✅ **CORRECT BEHAVIOR**:
- User handles ALL version control manually
- Agent reports when files are modified
- Agent NEVER initializes or commits to repositories

**Verification Commands**:
```bash
# Check for .git directory (should return "NO_GIT")
test -d .git && echo "GIT_EXISTS" || echo "NO_GIT"

# Find any git artifacts (should return nothing)
find . -name ".git" -type d
```

## Architecture Decisions (from plan.md)

### ADR-001: Auto-Incrementing Integer IDs vs UUIDs
**Decision**: Use auto-incrementing integers starting at 1
**Rationale**: Simple, predictable, human-readable for console interface
**Trade-off**: IDs never reused after deletion (ID preservation)

### ADR-002: Console Input Loop vs TUI Library
**Decision**: Use simple `input()`/`print()` with `match/case` routing
**Rationale**: Meets FR-001, no external dependencies, works everywhere
**Trade-off**: No advanced UI features (colors, windows, mouse support)

### ADR-003: Flat src/ Structure vs Package Hierarchy
**Decision**: Flat structure with 2 modules: `todo.py` and `main.py`
**Rationale**: Simple, no circular dependencies, easy to navigate
**Trade-off**: Limited scalability (acceptable for Phase I)

## Data Model (from src/todo.py)

### Task Dataclass
```python
@dataclass
class Task:
    id: int
    title: str
    description: str
    is_completed: bool = False
```

### TodoManager Class
**Methods**:
- `__init__() -> None` - Initialize empty list, ID counter starts at 1
- `add_task(title: str, description: str) -> Task` - Create task with auto-ID
- `get_all_tasks() -> list[Task]` - Return copy of task list
- `get_task_by_id(task_id: int) -> Task | None` - Find by ID or return None
- `update_task(task_id: int, title: str | None, description: str | None) -> bool` - Partial updates
- `delete_task(task_id: int) -> bool` - Remove task (ID never reused)
- `toggle_completion(task_id: int) -> bool` - Flip is_completed boolean

## Running the Application

### Development
```bash
# From project root
uv run python -m src.main

# Or using entry point
uv run todo
```

### Testing
```bash
# Automated validation tests
uv run python -m tests.run_validation

# Expected: 6/6 tests passed
```

## Implementation Status

### Completed Phases
- ✅ Phase 0: Environment Setup (3 tasks) - COMPLETE
- ✅ Phase 1: Data Model & Business Logic (8 tasks) - COMPLETE
- ✅ Phase 2: CLI Interface (7 tasks) - COMPLETE
- ✅ Phase 3: Testing & Validation (6 tasks) - COMPLETE
- ✅ Phase 4: Documentation & Finalization (3 tasks) - COMPLETE

### Validation Results
- **Total Tests**: 6 test suites
- **Passed**: 6/6 (100%)
- **Failed**: 0
- **Constitution Compliance**: 100%
- **Success Criteria**: 8/8 met

## Critical Reminders

### When Modifying Code
1. **Always read files first** before editing
2. **Update tasks.md** to mark completed tasks
3. **Create PHR** after completing work
4. **Run tests** to verify changes: `uv run python -m tests.run_validation`
5. **Check for .git** to ensure no accidental repository creation

### When Adding Features
1. **Start with spec** - Update `specs/001-todo-console-app/spec.md`
2. **Update plan** - Modify `specs/001-todo-console-app/plan.md`
3. **Break into tasks** - Add to `specs/001-todo-console-app/tasks.md`
4. **Implement** - Only after spec/plan/tasks approved
5. **Test** - Add to `tests/run_validation.py`
6. **Document** - Update README.md if user-facing

### When Debugging
1. **Check test report** - `specs_history/test_report_v1.md`
2. **Review PHRs** - `history/prompts/todo-console-app/`
3. **Verify constitution** - `.specify/memory/constitution.md`
4. **Run validation** - `uv run python -m tests.run_validation`

## Constraints Summary

### MUST DO
- ✅ Use type hints on all functions/methods
- ✅ Store data in memory only (no files/databases)
- ✅ Use Python 3.13+ syntax
- ✅ Follow PEP 8 formatting
- ✅ Document with docstrings
- ✅ Update tasks.md when completing work
- ✅ Create PHRs for all significant work

### MUST NOT DO
- ❌ Use git or gh commands
- ❌ Create .git directories
- ❌ Add external dependencies
- ❌ Use TUI libraries (curses, rich, etc.)
- ❌ Persist data to files or databases
- ❌ Modify code without reading files first

## Success Criteria (All Met)

- ✅ SC-001: User can launch from command line
- ✅ SC-002: All 5 CRUD operations work without errors
- ✅ SC-003: Task IDs unique, sequential, never reused
- ✅ SC-004: Status toggles Pending ↔ Completed
- ✅ SC-005: Invalid operations show errors without crashing
- ✅ SC-006: Runs without external dependencies
- ✅ SC-007: Type hints on all functions
- ✅ SC-008: Data lost on exit (in-memory verification)

## Contact & Support

For questions about:
- **Specifications**: Read `specs/001-todo-console-app/spec.md`
- **Architecture**: Read `specs/001-todo-console-app/plan.md`
- **Implementation**: Read `specs/001-todo-console-app/tasks.md`
- **Testing**: Read `specs_history/test_report_v1.md`
- **Constitution**: Read `.specify/memory/constitution.md`

---

**Last Updated**: 2026-01-01
**Version**: 1.0
**Status**: Phase 4 Complete - Production Ready
