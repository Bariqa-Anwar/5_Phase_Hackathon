# Implementation Plan: Build Secure Backend Foundation

**Branch**: `001-secure-backend-foundation` | **Date**: 2026-02-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-secure-backend-foundation/spec.md`

## Summary

This feature establishes the backend foundation for the Todo application by creating a FastAPI-based monorepo structure with JWT-secured SQLModel data layer connected to Neon PostgreSQL. The implementation provides complete CRUD REST API endpoints for task management with strict user-level data isolation. The technical approach uses UV for Python dependency management, SQLModel for type-safe ORM operations, and JWT middleware for stateless authentication aligned with the Better Auth frontend.

## Technical Context

**Language/Version**: Python 3.13 (as specified in constitution UV ecosystem)
**Primary Dependencies**: FastAPI 0.115+, SQLModel 0.0.22+, psycopg2-binary 2.9+, python-jose[cryptography] 3.3+, uvicorn 0.30+ (ASGI server)
**Storage**: Neon Serverless PostgreSQL (accessed via DATABASE_URL environment variable)
**Testing**: pytest 8.0+ with pytest-asyncio for async test support, httpx for API testing
**Target Platform**: Linux/Windows server (containerizable via Docker for deployment)
**Project Type**: Web application (backend portion of monorepo)
**Performance Goals**: <200ms p95 latency for single task operations, support 100+ concurrent users
**Constraints**: Stateless authentication (no session cookies), strict user-level query filtering, UV-managed dependencies only
**Scale/Scope**: Single backend service, 5 REST endpoints (CREATE, LIST, GET, UPDATE, DELETE), 1 data model (Task), JWT middleware layer

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**✅ I. Environment & Tooling Context**
- UV-managed Python ecosystem: Will use `uv add` for all dependencies, `uv run` for execution
- Monorepo structure: Creating `/backend` directory as specified, migrating root UV files
- Respecting existing `pyproject.toml` and `main.py` at root level

**✅ II. Spec-Kit Plus Directive**
- Spec-driven implementation: This plan derives directly from `specs/001-secure-backend-foundation/spec.md`
- Context hierarchy followed: References constitution, will create `/backend/CLAUDE.md` for FastAPI/SQLModel patterns

**✅ III. Technology Stack & Architecture**
- Backend stack compliant: FastAPI + SQLModel + Neon PostgreSQL as mandated
- Authentication architecture compliant: JWT verification middleware using BETTER_AUTH_SECRET
- RESTful API with JWT `Authorization: Bearer <token>` headers

**✅ IV. Security & Multi-Tenancy**
- Environment variables: DATABASE_URL and BETTER_AUTH_SECRET read from root `.env`
- Stateless backend: JWT-only authentication, no session cookies
- User isolation: All queries filter by `user_id` extracted from JWT token

**✅ V. Operational Workflow**
- Following Analysis → Planning → Execution → Verification workflow
- Using `uv` for all backend operations

**✅ VI. Strict Typing**
- SQLModel and Pydantic for all data structures
- Type hints mandatory for all functions

**✅ VII. Agentic Execution**
- All changes via agentic tools
- Smallest viable change principle
- Code references with file paths and line numbers

**Constitution Compliance**: ✅ PASS - All principles satisfied

## Project Structure

### Documentation (this feature)

```text
specs/001-secure-backend-foundation/
├── plan.md              # This file (/sp.plan command output)
├── spec.md              # Feature specification (already exists)
├── research.md          # Phase 0 output (UV migration, FastAPI patterns, JWT best practices)
├── data-model.md        # Phase 1 output (Task entity schema)
├── quickstart.md        # Phase 1 output (How to run backend server locally)
├── contracts/           # Phase 1 output (OpenAPI spec for REST endpoints)
│   └── openapi.yaml
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
backend/
├── pyproject.toml       # UV project file (migrated/updated from root)
├── uv.lock              # UV lockfile (migrated/updated from root)
├── main.py              # FastAPI application entry point (migrated/restructured from root)
├── db.py                # Database connection and session management
├── models.py            # SQLModel data models (Task)
├── auth.py              # JWT verification middleware and dependencies
├── routes/
│   └── tasks.py         # Task CRUD REST API endpoints
└── tests/
    ├── contract/        # API contract tests (OpenAPI schema validation)
    ├── integration/     # Database + auth integration tests
    └── unit/            # Business logic unit tests

root/
├── .env                 # Environment variables (DATABASE_URL, BETTER_AUTH_SECRET)
├── pyproject.toml       # Root UV project file (retained for workspace coordination)
└── main.py              # Root entry point (may become orchestrator or be removed)
```

**Structure Decision**: Selected **Option 2: Web application** structure as this is a monorepo backend. The `/backend` directory will be an independent UV project with its own `pyproject.toml` and dependencies. The root-level UV files will be retained for workspace coordination but the backend will operate independently. This aligns with constitution principle I (Monorepo Structure) and supports future frontend integration.

## Complexity Tracking

> **No violations detected** - All constitution checks passed. No complexity justification needed.

---

## Phase 0: Research & Technology Decisions

### Research Tasks

1. **UV Monorepo Migration Strategy**
   - **Question**: How to restructure root UV project into `/backend` subdirectory while maintaining workspace integrity?
   - **Research needed**: UV workspace features, dependency inheritance patterns, migration of existing `pyproject.toml`
   - **Decision criteria**: Preserve root UV context, enable independent backend execution, support future `/frontend` addition

2. **FastAPI Project Structure Best Practices**
   - **Question**: What is the recommended directory layout for FastAPI with SQLModel for maintainability?
   - **Research needed**: Separation of concerns (models, routes, services), dependency injection patterns, error handling structure
   - **Decision criteria**: Align with constitution directory structure (models/, services/, api/), minimize coupling

3. **Neon PostgreSQL Connection Patterns**
   - **Question**: How to implement connection pooling and reconnection for Neon Serverless PostgreSQL with SQLModel?
   - **Research needed**: SQLModel engine configuration, async vs sync operations, connection string format, pool sizing
   - **Decision criteria**: <5 second reconnection time (SC-005), support 100 concurrent users (SC-007)

4. **JWT Verification with python-jose**
   - **Question**: How to securely verify JWT tokens and extract claims using python-jose with Better Auth tokens?
   - **Research needed**: Token signature algorithms (HS256 vs RS256), expiration handling, claim extraction, error responses
   - **Decision criteria**: 100% rejection of invalid tokens (SC-004), extract user_id for query filtering

5. **User Isolation Query Patterns**
   - **Question**: How to enforce user_id filtering at the ORM level to prevent data leakage?
   - **Research needed**: SQLModel query filtering, dependency injection for current user, automated WHERE clause injection
   - **Decision criteria**: Zero cross-user data leakage (SC-003), all queries automatically filter by user_id

### Research Output

Research findings will be documented in `research.md` with the following format for each decision:

```markdown
## Decision: [Technology/Pattern Name]

**Context**: [What problem this solves]

**Options Considered**:
1. Option A: [description] - Pros: [...], Cons: [...]
2. Option B: [description] - Pros: [...], Cons: [...]

**Decision**: [Chosen option]

**Rationale**: [Why this option best meets success criteria and constitution principles]

**Implementation Notes**: [Key configuration details, gotchas, examples]
```

---

## Phase 1: Design & Contracts

### Data Model Design

**Output**: `data-model.md`

Based on FR-004 and User Story 3, the Task entity will be designed with:

- **Entity**: Task
- **Fields**:
  - `id`: Integer (primary key, auto-increment)
  - `title`: String (required, max 200 characters)
  - `description`: String (optional, max 2000 characters)
  - `status`: Enum/String (required, values: "pending", "in_progress", "completed")
  - `user_id`: String (required, indexed for query performance, foreign key concept to user)
  - `created_at`: DateTime (auto-generated on create)
  - `updated_at`: DateTime (auto-updated on modify)

- **Relationships**: Task belongs to User (via user_id)
- **Indexes**: Primary on `id`, composite index on `(user_id, id)` for efficient user-scoped queries
- **Validation Rules**:
  - `title`: Non-empty, max 200 chars
  - `status`: Must be one of ["pending", "in_progress", "completed"]
  - `user_id`: Non-empty, matches JWT claim
  - `description`: Max 2000 chars (optional)

### API Contracts

**Output**: `contracts/openapi.yaml`

Based on FR-007 through FR-011, the following REST API endpoints will be specified:

| Endpoint | Method | Auth | Request Body | Response | Description |
|----------|--------|------|--------------|----------|-------------|
| `/api/tasks` | POST | Required | `TaskCreate` schema | 201 + Task | Create new task for authenticated user |
| `/api/tasks` | GET | Required | Query params: limit, offset | 200 + Task[] | List user's tasks (paginated) |
| `/api/tasks/{task_id}` | GET | Required | - | 200 + Task / 404 | Get single task (user ownership enforced) |
| `/api/tasks/{task_id}` | PUT | Required | `TaskUpdate` schema | 200 + Task / 404 | Update task (user ownership enforced) |
| `/api/tasks/{task_id}` | DELETE | Required | - | 204 / 404 | Delete task (user ownership enforced) |

**Request/Response Schemas** (Pydantic models):

- `TaskCreate`: { title, description?, status }
- `TaskUpdate`: { title?, description?, status? }
- `Task`: { id, title, description, status, user_id, created_at, updated_at }
- `ErrorResponse`: { detail: string, status_code: int }

**Authentication**: All endpoints require `Authorization: Bearer <JWT>` header. Returns 401 if missing/invalid.

**Error Codes**:
- 200: Success (GET, PUT)
- 201: Created (POST)
- 204: No Content (DELETE)
- 401: Unauthorized (invalid/missing JWT)
- 404: Not Found (task doesn't exist or doesn't belong to user)
- 422: Unprocessable Entity (validation error)
- 500: Internal Server Error (database/system error)

### Quickstart Guide

**Output**: `quickstart.md`

Will document:
1. Prerequisites (UV installed, .env configured with DATABASE_URL and BETTER_AUTH_SECRET)
2. Setup commands:
   ```bash
   cd backend
   uv sync                              # Install dependencies
   uv run python -m uvicorn main:app --reload  # Start dev server
   ```
3. Environment variables required:
   - `DATABASE_URL`: Neon PostgreSQL connection string
   - `BETTER_AUTH_SECRET`: Shared secret for JWT verification
4. Testing the API:
   - Health check: `curl http://localhost:8000/health`
   - Create task (requires valid JWT): Example curl command
5. Running tests:
   ```bash
   cd backend
   uv run pytest                        # Run all tests
   uv run pytest tests/integration/     # Integration tests only
   ```

### Agent Context Update

After Phase 1 design complete, will run:

```bash
.specify/scripts/powershell/update-agent-context.ps1 -AgentType claude
```

This will update `/backend/CLAUDE.md` with:
- FastAPI routing patterns used in this project
- SQLModel model definitions and query patterns
- JWT middleware usage and dependency injection
- Error handling conventions (HTTP status codes)
- Testing patterns (contract, integration, unit)

**Preservation**: Manual additions between `<!-- MANUAL_START -->` and `<!-- MANUAL_END -->` markers will be preserved.

---

## Phase 2: Planning Complete

This plan is now ready for task generation via `/sp.tasks`.

**Next Steps**:
1. Execute Phase 0 research → produce `research.md`
2. Execute Phase 1 design → produce `data-model.md`, `contracts/openapi.yaml`, `quickstart.md`
3. Update agent context → update `/backend/CLAUDE.md`
4. User runs `/sp.tasks` to generate task breakdown from this plan
