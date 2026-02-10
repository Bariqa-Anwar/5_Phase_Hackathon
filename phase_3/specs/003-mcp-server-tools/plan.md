# Implementation Plan: MCP Server Tools

**Branch**: `003-mcp-server-tools` | **Date**: 2026-02-08 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/003-mcp-server-tools/spec.md`

## Summary

Implement a standalone MCP server (`backend/mcp_server.py`) using the
Official MCP SDK (FastMCP) that exposes 5 task-management tools
(`add_task`, `list_tasks`, `complete_task`, `delete_task`, `update_task`).
The server reuses the existing SQLModel engine and Task model from
Phase 2, performs direct database operations scoped by `user_id`, and
runs as a stdio subprocess consumed by the OpenAI Agents SDK. No
existing Phase 2 code is modified. Conversation and Message models are
added to `models.py` as forward schema for the chatbot layer.

## Technical Context

**Language/Version**: Python 3.13 (via `.python-version`)
**Primary Dependencies**: FastMCP (`mcp[cli]`), OpenAI Agents SDK (`openai-agents`), FastAPI 0.128.1, SQLModel 0.0.32
**Storage**: Neon PostgreSQL via `psycopg2-binary` (existing)
**Testing**: pytest (existing dev dependency)
**Target Platform**: Linux server (Vercel/Railway)
**Project Type**: Web application (backend + frontend)
**Performance Goals**: Standard web app — tool calls complete in <1s
**Constraints**: No in-memory state; all queries scoped by user_id; no changes to existing code
**Scale/Scope**: 5 MCP tools, 2 new SQLModel models, 1 new file

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. UV Environment Discipline | ✅ PASS | Dependencies added via `uv add "mcp[cli]" openai-agents` |
| II. FastAPI Entry Convention | ✅ PASS | MCP server is a separate subprocess (`mcp_server.py`), not a FastAPI route. `backend/main.py` unchanged. |
| III. Spec-Driven Development | ✅ PASS | Plan derived from `specs/003-mcp-server-tools/spec.md` |
| IV. Git Guardrails | ✅ PASS | No git operations in plan |
| V. Stateless Architecture | ✅ PASS | All tools do direct DB queries via `Session(engine)`. No in-memory state. Conversation/Message models defined for future persistence. |
| VI. AI & MCP Stack | ✅ PASS | Official MCP SDK (FastMCP) + OpenAI Agents SDK. No LangChain/CrewAI. |
| VII. Deployment Readiness | ✅ PASS | Pydantic validation on all inputs. Secrets via env vars. `.env.example` to be updated. |

## Project Structure

### Documentation (this feature)

```text
specs/003-mcp-server-tools/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Technology research & decisions
├── data-model.md        # Entity schemas & tool I/O contracts
├── quickstart.md        # Setup & verification guide
├── contracts/
│   └── mcp-tools.md     # MCP tool input/output schemas
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Task breakdown (created by /sp.tasks)
```

### Source Code (repository root)

```text
backend/
├── main.py              # FastAPI app (UNCHANGED)
├── db.py                # Database engine & session (UNCHANGED)
├── auth.py              # JWT middleware (UNCHANGED)
├── models.py            # SQLModel models (EXTENDED)
│                        #   - Existing: Task, TaskStatus, TaskCreate,
│                        #     TaskUpdate, TaskResponse
│                        #   - NEW: Conversation, Message, MessageRole
├── mcp_server.py        # NEW — MCP server with 5 tools
├── routes/
│   ├── __init__.py      # UNCHANGED
│   └── tasks.py         # UNCHANGED
└── pyproject.toml       # UPDATED — new dependencies added
```

**Structure Decision**: Extend existing backend directory. MCP server
is a single new file (`mcp_server.py`) at the backend root, alongside
`main.py`. It imports `models.py` and `db.py` directly. No new
directories needed — the 5 tools fit cleanly in one module.

## Architecture Decisions

### AD-1: MCP Server as Standalone Subprocess

The MCP server runs as a separate Python process, not as part of the
FastAPI application. The OpenAI Agents SDK spawns it via
`MCPServerStdio` using stdio transport.

**Why**: Separation of concerns. The FastAPI app serves the web
frontend via REST+JWT. The MCP server serves the AI agent layer via
the MCP protocol. They share only the database.

**Implication**: `mcp_server.py` has its own `if __name__ == "__main__"`
entry point with `mcp.run(transport="stdio")`. It is never imported
by `main.py`.

### AD-2: Reuse Existing DB Engine

The MCP server imports `engine` from `db.py` and creates sessions
directly via `Session(engine)` context manager. It does NOT use
FastAPI's `Depends(get_session)` since it runs outside FastAPI.

**Why**: Reuses existing connection pool configuration (pool_size=10,
max_overflow=20, pool_pre_ping=True). Avoids duplicating DB config.

**Implication**: `db.py` is imported at module level in `mcp_server.py`.
The `.env` file is loaded by `db.py` automatically.

### AD-3: Sync Tool Functions

All 5 MCP tools are synchronous functions (not async). They use
synchronous SQLModel sessions.

**Why**: Consistent with existing backend patterns. The existing
`engine` uses `psycopg2-binary` (sync driver). FastMCP supports
both sync and async tools. Sync is simpler and avoids needing
`asyncpg` or `greenlet`.

### AD-4: Additive-Only Changes to models.py

New models (`Conversation`, `Message`, `MessageRole`) are appended
to the end of `models.py`. Existing models (`Task`, `TaskStatus`,
`TaskCreate`, `TaskUpdate`, `TaskResponse`) are NOT modified.

**Why**: FR-010 mandates no breaking changes. Adding new classes at
the end of the file is purely additive.

### AD-5: Table Creation Strategy

New tables (`conversations`, `messages`) are created via
`SQLModel.metadata.create_all(engine)` called in `mcp_server.py`
at startup. This is idempotent — it only creates tables that don't
exist yet, leaving existing tables unchanged.

**Why**: No migration tool (Alembic) is configured. `create_all` is
the simplest safe approach for additive schema changes. It will NOT
alter existing tables.

## Implementation Phases

### Phase 1: Dependencies & Models (Setup)

1. Add `mcp[cli]` and `openai-agents` via `uv add` in `backend/`
2. Append `MessageRole` enum, `Conversation` model, and `Message`
   model to `backend/models.py`
3. Verify existing tests still pass

### Phase 2: MCP Server Core (Foundational)

1. Create `backend/mcp_server.py` with FastMCP server instance
2. Import `engine` from `db.py` and models from `models.py`
3. Add `create_all(engine)` for table initialization
4. Add `if __name__ == "__main__": mcp.run(transport="stdio")`
5. Verify server starts without errors

### Phase 3: Tool Implementation (US1 — P1 MVP)

1. Implement `add_task` tool with user_id scoping
2. Implement `list_tasks` tool with optional status filter
3. Implement `complete_task` tool with idempotent behavior
4. Implement `delete_task` tool with existence check
5. Implement `update_task` tool with partial update validation
6. Each tool: direct Session(engine), user_id WHERE clause, error handling

### Phase 4: Validation & Edge Cases (US2 — P1)

1. Verify user isolation across all tools
2. Verify validation errors for invalid inputs
3. Verify idempotent complete_task behavior
4. Verify update_task requires at least one field
5. Verify coexistence with REST API (US3)

### Phase 5: Environment & Docs (US4 — P2)

1. Update `.env.example` with new variables
2. Verify `OPENAI_BASE_URL` / `OPENAI_API_KEY` env var pattern works

## Key Design: mcp_server.py Structure

```python
"""
MCP Server for Todo Task Management
Official MCP SDK (FastMCP) — stdio transport
"""
from datetime import datetime, UTC
from typing import Optional
from mcp.server.fastmcp import FastMCP
from sqlmodel import Session, select

from db import engine
from models import Task, TaskStatus, SQLModel

# Initialize tables (idempotent — only creates if not exists)
SQLModel.metadata.create_all(engine)

# Create MCP server
mcp = FastMCP("todo-tools")


@mcp.tool()
def add_task(user_id: str, title: str, description: str = "") -> dict:
    """Add a new task for the specified user."""
    with Session(engine) as session:
        task = Task(
            title=title,
            description=description or None,
            user_id=user_id,
        )
        session.add(task)
        session.commit()
        session.refresh(task)
        return _task_to_dict(task)


@mcp.tool()
def list_tasks(user_id: str, status: str = "") -> dict:
    """List tasks for user, optionally filtered by status."""
    with Session(engine) as session:
        query = select(Task).where(Task.user_id == user_id)
        if status:
            query = query.where(Task.status == TaskStatus(status))
        query = query.order_by(Task.created_at.desc())
        tasks = session.exec(query).all()
        return {
            "tasks": [_task_to_dict(t) for t in tasks],
            "count": len(tasks),
        }


# ... complete_task, delete_task, update_task follow same pattern


def _task_to_dict(task: Task) -> dict:
    """Serialize Task to dict for tool output."""
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "status": task.status.value,
        "user_id": task.user_id,
        "created_at": task.created_at.isoformat(),
        "updated_at": task.updated_at.isoformat(),
    }


if __name__ == "__main__":
    mcp.run(transport="stdio")
```

## Files Changed Summary

| File | Action | Description |
|------|--------|-------------|
| `backend/pyproject.toml` | UPDATED | Add `mcp[cli]`, `openai-agents` dependencies |
| `backend/models.py` | EXTENDED | Append `MessageRole`, `Conversation`, `Message` models |
| `backend/mcp_server.py` | NEW | MCP server with 5 tools |
| `.env.example` | UPDATED | Add `OPENAI_BASE_URL`, `OPENAI_API_KEY` |

**Files NOT changed** (verified):
- `backend/main.py` — no modifications
- `backend/db.py` — no modifications
- `backend/auth.py` — no modifications
- `backend/routes/tasks.py` — no modifications
- `backend/routes/__init__.py` — no modifications
- All frontend files — no modifications

## Risks

1. **`SQLModel.metadata.create_all` may not create new tables if
   metadata is incomplete** — Mitigated by importing all model
   classes before calling `create_all`.
2. **FastMCP version incompatibility** — Mitigated by using the
   latest `mcp[cli]` package and verifying the `FastMCP` import.
3. **Connection pool exhaustion under concurrent MCP + REST load** —
   Existing pool (10 + 20 overflow) should handle this. Monitor
   if both systems are under heavy load simultaneously.

## Complexity Tracking

> No Constitution Check violations. No complexity justifications needed.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None      | —          | —                                   |
