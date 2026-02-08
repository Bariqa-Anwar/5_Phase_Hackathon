<!--
Sync Impact Report:
- Version change: [Initial] → 1.0.0
- Modified principles: [All - Initial creation]
- Added sections: All core principles, Environment & Tooling Context, Spec-Kit Plus Directive, Technology Stack & Architecture, Operational Workflow, Restrictions, Governance
- Removed sections: None
- Templates requiring updates:
  ✅ plan-template.md (Constitution Check section validated)
  ✅ spec-template.md (Requirements alignment validated)
  ✅ tasks-template.md (Task categorization validated)
- Follow-up TODOs: None
-->

# Todo Full-Stack Constitution (Phase II)

## Core Principles

### I. Environment & Tooling Context

**UV-Managed Python Ecosystem:** UV is the authoritative Python package and environment manager. All Python operations MUST use `uv run` for execution and `uv add` for dependencies. The virtual environment is pre-activated; NEVER attempt to create a `.venv` manually.

**Monorepo Structure:** The project is organized as a monorepo with the following top-level directories:
- `.specify/` — Spec-Kit Plus templates and scripts
- `specs/` — Feature specifications and planning artifacts
- `frontend/` — Next.js 16 application
- `backend/` — FastAPI application
- Root files: `pyproject.toml`, `main.py` (respect and update existing files)

**Rationale:** UV provides deterministic dependency resolution and faster package management. The monorepo structure enables code sharing, consistent tooling, and coordinated releases while maintaining clear separation of concerns between frontend and backend.

### II. Spec-Kit Plus Directive

**Spec-Driven Implementation:** Before ANY code change, you MUST read the corresponding specification in `/specs/`. Specifications are the single source of truth for feature requirements.

**Reflective Updates:** If an implementation detail deviates from the spec, you MUST update the `.md` file in `/specs/` FIRST, then proceed with implementation. The spec and code must remain synchronized.

**Context Hierarchy (Mandatory Reference Order):**
1. `/CLAUDE.md` — Global project rules
2. `/backend/CLAUDE.md` — FastAPI/SQLModel patterns
3. `/frontend/CLAUDE.md` — Next.js 16/Better Auth patterns

**Rationale:** Spec-driven development prevents scope creep, ensures traceability, and enables multiple agents or developers to work coherently. The context hierarchy ensures consistent patterns across the codebase.

### III. Technology Stack & Architecture (NON-NEGOTIABLE)

**Backend Stack:**
- FastAPI — Web framework
- SQLModel — ORM and Pydantic model integration
- Neon Serverless PostgreSQL — Database

**Frontend Stack:**
- Next.js 16 (App Router) — React framework
- Tailwind CSS — Styling
- TypeScript — Type safety

**Authentication Architecture:**
- Better Auth (Frontend) — Session management and UI flows
- JWT Verification Middleware (Backend) — Stateless API authentication
- Shared Secret: `BETTER_AUTH_SECRET` environment variable for JWT signing/verification

**Communication Protocol:**
- RESTful API
- Mandatory JWT `Authorization: Bearer <token>` headers on all protected endpoints

**Rationale:** This stack provides type safety across the entire application (SQLModel → FastAPI → TypeScript), serverless scaling capabilities, and clear separation between frontend session management and backend API security.

### IV. Security & Multi-Tenancy (NON-NEGOTIABLE)

**Environment Variables:** NEVER hardcode secrets or tokens. Use `.env` files and environment variables for all sensitive configuration. The `BETTER_AUTH_SECRET` MUST be shared between frontend and backend.

**Stateless Backend Authentication:** The backend MUST NOT use session cookies. All authentication is strictly JWT-based for API isolation and horizontal scalability.

**User Isolation:** Every database query MUST filter by `user_id`. Multi-tenant data isolation is mandatory at the query level, not the application level.

**Rationale:** Stateless authentication enables horizontal scaling. Per-query user filtering prevents data leakage between users and ensures compliance with data privacy requirements.

### V. Operational Workflow

**Analysis Phase:** Read `@specs/overview.md` and the specific feature spec (e.g., `@specs/features/authentication.md`) before writing any code.

**Planning Phase:** Generate a step-by-step implementation plan based on specifications. Identify dependencies, risks, and testing requirements.

**Execution Phase:**
- Use `uv` for backend tasks (e.g., `uv run python -m backend.main`, `uv add fastapi`)
- Use `npm/bun` for frontend tasks (e.g., `npm run dev`, `npm install`)
- Edit files according to the established directory structure in the implementation plan

**Verification Phase:** Ensure all 5 basic features (CRUD + Auth) are functional and responsive. Test multi-user scenarios and verify user isolation.

**Rationale:** This workflow ensures deliberate, spec-driven development with clear phase gates and verification steps. It prevents ad-hoc changes and ensures quality.

### VI. Strict Typing (NON-NEGOTIABLE)

**Python Code:** MUST use Pydantic and SQLModel types for all data structures. Type hints are mandatory for all functions.

**Frontend Code:** MUST use TypeScript with strict mode enabled. No `any` types except in narrowly scoped, well-justified cases.

**Rationale:** End-to-end type safety catches errors at compile time, enables better IDE support, and serves as living documentation. The SQLModel → FastAPI → TypeScript chain ensures type consistency across the stack.

### VII. Agentic Execution (NON-NEGOTIABLE)

**No Manual Coding:** All changes MUST be performed via agentic tools (Read, Write, Edit, Bash, etc.). This ensures traceability and prevents undocumented modifications.

**Smallest Viable Change:** Prefer the smallest viable diff. Do NOT refactor unrelated code. Focus changes on the specific feature or fix at hand.

**Code References:** When proposing changes, cite existing code with precise references (file path and line numbers). Propose new code in fenced blocks with language identifiers.

**Rationale:** Agentic execution provides audit trails, enables reproducibility, and prevents scope creep. Small, focused changes reduce merge conflicts and simplify code review.

## Development Constraints

### Existing Files
- Respect and update the existing `pyproject.toml` and `main.py` created during UV initialization
- Do not delete or overwrite UV-managed configuration without explicit user approval

### Directory Structure
- Backend: Follow FastAPI best practices with `models/`, `services/`, `api/` directories
- Frontend: Follow Next.js App Router conventions with `app/`, `components/`, `lib/` directories
- Tests: Organize as `tests/contract/`, `tests/integration/`, `tests/unit/`

### Error Handling
- Backend: Use structured error responses with appropriate HTTP status codes
- Frontend: Implement user-friendly error messages with fallback UI states
- Logging: Use structured logging (JSON format) for all error conditions

## Testing Requirements

### Backend Testing
- Contract tests for API endpoints (validate request/response schemas)
- Integration tests for database operations (verify user isolation)
- Unit tests for business logic (pure functions)

### Frontend Testing
- Component tests for UI interactions
- Integration tests for API client logic
- E2E tests for critical user flows (authentication, CRUD operations)

### Test-Driven Development
- Write tests FIRST for new features
- Ensure tests FAIL before implementing
- Follow Red-Green-Refactor cycle

## Governance

### Constitution Authority
This constitution supersedes all other practices. When conflicts arise, this document takes precedence.

### Amendments
Amendments require:
1. Documentation of the change with rationale
2. User approval
3. Migration plan for existing code (if applicable)
4. Update to version number following semantic versioning:
   - MAJOR: Backward incompatible governance/principle removals or redefinitions
   - MINOR: New principle/section added or materially expanded guidance
   - PATCH: Clarifications, wording, typo fixes, non-semantic refinements

### Compliance Review
- All PRs and code reviews MUST verify compliance with this constitution
- Complexity MUST be justified against principles
- Use `/CLAUDE.md` for runtime development guidance and agent-specific instructions

### Versioning Policy
- Version changes MUST be documented in the Sync Impact Report (HTML comment at top of file)
- Version increments MUST follow semantic versioning rules
- Template consistency MUST be maintained (plan-template.md, spec-template.md, tasks-template.md)

**Version**: 1.0.0 | **Ratified**: 2026-02-05 | **Last Amended**: 2026-02-05
