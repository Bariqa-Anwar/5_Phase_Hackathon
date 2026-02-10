<!-- Sync Impact Report
  Version change: 0.0.0 → 1.0.0 (MAJOR — initial ratification)
  Modified principles: N/A (initial creation)
  Added sections:
    - Principle I: UV Environment Discipline
    - Principle II: FastAPI Entry Convention
    - Principle III: Spec-Driven Development
    - Principle IV: Git Guardrails
    - Principle V: Stateless Architecture
    - Principle VI: AI & MCP Stack
    - Principle VII: Deployment Readiness
    - Section: Technology Stack & Constraints
    - Section: Development Workflow
    - Governance
  Removed sections: N/A (initial)
  Templates requiring updates:
    - .specify/templates/plan-template.md — ✅ no update needed (generic)
    - .specify/templates/spec-template.md — ✅ no update needed (generic)
    - .specify/templates/tasks-template.md — ✅ no update needed (generic)
  Follow-up TODOs: none
-->

# Phase 3: Todo AI Chatbot | UV & Agentic Stack — Constitution

## Core Principles

### I. UV Environment Discipline

All dependency management MUST use the existing `uv` project structure.
Agents and contributors MUST respect `.python-version` (3.13),
`pyproject.toml`, and the existing virtual environment.

- New dependencies MUST be added exclusively via `uv add`.
- `pip install` is **STRICTLY FORBIDDEN** in all contexts.
- The `uv.lock` file (when present) MUST be committed and kept
  in sync.

### II. FastAPI Entry Convention

The existing `main.py` at the repository root is the primary
FastAPI application entry point.

- Secondary entry files MUST NOT be created unless modularizing
  logic into an `/app` directory as per FastAPI best practices.
- All route registration, middleware, and lifespan hooks MUST
  originate from or be imported into `main.py`.

### III. Spec-Driven Development (No Vibe Coding)

All implementation work MUST follow the Agentic Dev Stack:
**Spec -> Plan -> Tasks -> Execution**.

- Every feature MUST have a specification in `specs/<feature>/spec.md`
  before any code is written.
- Implementation MUST be traceable to tasks derived from the spec.
- Ad-hoc coding without a backing spec or task is FORBIDDEN.

### IV. Git Guardrails

Repository management is the user's manual responsibility.

- Agents MUST NOT run `git` commands of any kind.
- Agents MUST NOT read, write, or modify anything under `.git/`.
- Agents MUST NOT attempt to push, pull, fetch, or clone.
- This rule has NO exceptions.

### V. Stateless Architecture

The server MUST hold NO in-memory state between requests.

- All persistence (Tasks, Conversations, Messages) MUST use
  Neon PostgreSQL via SQLModel.
- MCP Tools (`add_task`, `list_tasks`, etc.) MUST perform direct
  database operations — no caching layers or in-memory stores.
- Each request MUST be independently satisfiable from the database
  alone.

### VI. AI & MCP Stack

The agentic layer MUST use the following stack:

- **MCP SDK** (Official) for tool definition and registration.
- **OpenAI Agents SDK** for the orchestration/agent layer.
- **ChatKit** integration MUST follow the stateless request cycle:
  History Fetch -> Agent Run -> Save -> Respond.
- No alternative agent frameworks (LangChain, CrewAI, etc.)
  unless explicitly approved via constitutional amendment.

### VII. Deployment Readiness

All code MUST be production-ready for Vercel or Railway deployment.

- Every request/response model MUST use Pydantic schemas.
- Secrets (`DATABASE_URL`, `OPENAI_API_KEY`, etc.) MUST be read
  from environment variables — never hardcoded.
- A `.env.example` file MUST document all required environment
  variables without exposing actual values.

## Technology Stack & Constraints

| Layer            | Technology                        |
|------------------|-----------------------------------|
| Language         | Python 3.13 (via `.python-version`) |
| Package Manager  | `uv`                             |
| Web Framework    | FastAPI                          |
| ORM / Models     | SQLModel                         |
| Database         | Neon PostgreSQL                  |
| AI Orchestration | OpenAI Agents SDK                |
| Tool Protocol    | MCP SDK (Official)               |
| Validation       | Pydantic v2                      |
| Deployment       | Vercel / Railway                 |

**Constraints**:

- No `pip`, `poetry`, or `conda` — `uv` only.
- No in-memory state — database-backed persistence only.
- No manual git operations by agents — user-managed exclusively.
- No ad-hoc implementation — spec-driven workflow enforced.

## Development Workflow

1. **Specify**: Create or update `specs/<feature>/spec.md` with user
   stories, acceptance criteria, and requirements.
2. **Plan**: Generate `specs/<feature>/plan.md` with architecture
   decisions, technical context, and project structure.
3. **Task**: Generate `specs/<feature>/tasks.md` with dependency-ordered,
   testable implementation tasks.
4. **Execute**: Implement tasks sequentially, verifying each against
   its acceptance criteria before proceeding.
5. **Record**: Create a PHR for every significant interaction under
   `history/prompts/`.

Quality gates at each stage:

- Spec MUST have testable acceptance scenarios before planning.
- Plan MUST pass a Constitution Check before task generation.
- Tasks MUST reference exact file paths and have clear done criteria.
- Code MUST use Pydantic schemas, SQLModel models, and env-based config.

## Governance

This constitution is the authoritative source of project rules and
supersedes all other practices, conventions, or assumptions.

**Amendment procedure**:

1. Propose the change with rationale and impact analysis.
2. Obtain explicit user approval.
3. Update this document with a version bump.
4. Propagate changes to dependent templates if affected.
5. Record the amendment in a PHR.

**Versioning policy**: Semantic versioning (MAJOR.MINOR.PATCH).

- MAJOR: Principle removal, redefinition, or backward-incompatible
  governance change.
- MINOR: New principle or materially expanded guidance added.
- PATCH: Clarifications, wording, or non-semantic refinements.

**Compliance**: All specs, plans, and tasks MUST be verified against
this constitution before execution. Non-compliance MUST be flagged
and resolved before proceeding.

**Version**: 1.0.0 | **Ratified**: 2026-02-08 | **Last Amended**: 2026-02-08
