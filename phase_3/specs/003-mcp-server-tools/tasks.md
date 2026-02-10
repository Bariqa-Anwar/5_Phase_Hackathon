---
description: "Task list for MCP Server Tools implementation"
---

# Tasks: MCP Server Tools

**Input**: Design documents from `specs/003-mcp-server-tools/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/mcp-tools.md

**Tests**: User requested a verification test script (T016). No TDD cycle requested.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/` at repository root
- All paths relative to repository root (`E:\phase_3\`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies and verify environment readiness

- [x] T001 Run `uv add "mcp[cli]" openai-agents` in `backend/` to install MCP SDK and OpenAI Agents SDK dependencies in `backend/pyproject.toml`
- [x] T002 Verify existing dependencies (`sqlmodel>=0.0.32`, `psycopg2-binary>=2.9.11`) are present in `backend/pyproject.toml` — no action needed if already listed

**Checkpoint**: `backend/pyproject.toml` has `mcp[cli]` and `openai-agents` in dependencies. `uv sync` succeeds.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend database schema and create MCP server shell — MUST complete before any tool implementation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Append `MessageRole` enum to `backend/models.py` after the existing `TaskResponse` class — values: `"user"`, `"assistant"`, `"system"`, `"tool"` — following the same pattern as existing `TaskStatus` enum (inherits from `str, Enum`)
- [x] T004 Append `Conversation` SQLModel class to `backend/models.py` — fields: `id` (Optional[int], PK), `user_id` (str, max_length=255, indexed), `title` (Optional[str], max_length=200), `created_at` (datetime, default_factory=datetime.utcnow), `updated_at` (datetime, default_factory=datetime.utcnow) — table name: `conversations` — see `data-model.md` "New Entity: Conversation"
- [x] T005 Append `Message` SQLModel class to `backend/models.py` — fields: `id` (Optional[int], PK), `conversation_id` (int, foreign_key="conversations.id", indexed), `role` (MessageRole), `content` (str), `tool_name` (Optional[str]), `tool_call_id` (Optional[str]), `created_at` (datetime, default_factory=datetime.utcnow) — table name: `messages` — composite index on `(conversation_id, created_at)` — see `data-model.md` "New Entity: Message"
- [x] T006 Create `backend/mcp_server.py` with: (a) imports from `mcp.server.fastmcp.FastMCP`, `sqlmodel.Session`, `sqlmodel.select`, `db.engine`, `models.Task`, `models.TaskStatus`, `models.SQLModel`; (b) `SQLModel.metadata.create_all(engine)` for idempotent table creation; (c) `mcp = FastMCP("todo-tools")` server instance; (d) `_task_to_dict(task: Task) -> dict` helper that serializes id, title, description, status (`.value`), user_id, created_at (`.isoformat()`), updated_at (`.isoformat()`); (e) `if __name__ == "__main__": mcp.run(transport="stdio")` entry point — see `plan.md` "Key Design: mcp_server.py Structure" and `research.md` R1, R2

**Checkpoint**: `python backend/mcp_server.py` starts without errors (connects to DB, creates new tables if needed, waits on stdio). Existing `backend/main.py` is UNCHANGED. Existing tests pass.

---

## Phase 3: User Story 1 — AI Agent Manages Tasks (Priority: P1) 🎯 MVP

**Goal**: All 5 MCP tools functional — an AI agent can create, list, complete, delete, and update tasks through tool calls.

**Independent Test**: Call each tool via MCP inspector (`mcp dev backend/mcp_server.py`) with a test user_id. Verify tasks appear in Neon DB and are returned correctly.

### Implementation for User Story 1

- [x] T007 [US1] Implement `add_task` tool in `backend/mcp_server.py` — decorator: `@mcp.tool()`, params: `user_id: str`, `title: str`, `description: str = ""`, returns: `dict` — logic: create `Task(title=title, description=description or None, user_id=user_id)` in `Session(engine)`, commit, refresh, return `_task_to_dict(task)` — see `contracts/mcp-tools.md` "Tool: add_task"
- [x] T008 [US1] Implement `list_tasks` tool in `backend/mcp_server.py` — decorator: `@mcp.tool()`, params: `user_id: str`, `status: str = ""`, returns: `dict` — logic: `select(Task).where(Task.user_id == user_id)`, if status non-empty add `.where(Task.status == TaskStatus(status))`, add `.order_by(Task.created_at.desc())`, return `{"tasks": [_task_to_dict(t) for t in tasks], "count": len(tasks)}` — see `contracts/mcp-tools.md` "Tool: list_tasks"
- [x] T009 [US1] Implement `complete_task` tool in `backend/mcp_server.py` — decorator: `@mcp.tool()`, params: `user_id: str`, `task_id: int`, returns: `dict` — logic: `select(Task).where(Task.id == task_id, Task.user_id == user_id)`, if not found return `{"error": "Task not found"}`, else set `task.status = TaskStatus.COMPLETED`, `task.updated_at = datetime.now(UTC)`, commit, refresh, return `_task_to_dict(task)` — idempotent: if already completed, return unchanged — see `contracts/mcp-tools.md` "Tool: complete_task"
- [x] T010 [US1] Implement `delete_task` tool in `backend/mcp_server.py` — decorator: `@mcp.tool()`, params: `user_id: str`, `task_id: int`, returns: `dict` — logic: `select(Task).where(Task.id == task_id, Task.user_id == user_id)`, if not found return `{"error": "Task not found"}`, else `session.delete(task)`, commit, return `{"deleted": True, "task_id": task_id}` — see `contracts/mcp-tools.md` "Tool: delete_task"
- [x] T011 [US1] Implement `update_task` tool in `backend/mcp_server.py` — decorator: `@mcp.tool()`, params: `user_id: str`, `task_id: int`, `title: str = ""`, `description: str = ""`, returns: `dict` — logic: validate at least one of title/description is non-empty (return `{"error": "At least one of title or description must be provided"}` if both empty), look up by task_id + user_id, if not found return `{"error": "Task not found"}`, apply non-empty fields, set `task.updated_at = datetime.now(UTC)`, commit, refresh, return `_task_to_dict(task)` — see `contracts/mcp-tools.md` "Tool: update_task"

**Checkpoint**: All 5 tools respond correctly via `mcp dev backend/mcp_server.py`. A task can be created, listed, updated, completed, and deleted in sequence.

---

## Phase 4: User Story 2 — User Isolation Enforcement (Priority: P1)

**Goal**: Guarantee that no tool ever leaks or modifies data across users.

**Independent Test**: Call `add_task` with user_id "user-A", then call `list_tasks`, `complete_task`, `delete_task` with user_id "user-B" and the same task_id — verify "user-B" gets "Task not found" for every operation.

### Implementation for User Story 2

- [x] T012 [US2] Add input validation to all 5 tools in `backend/mcp_server.py` — wrap each tool body in try/except: on `ValueError` (invalid status enum) return `{"error": "Invalid status. Must be one of: pending, in_progress, completed"}`, on general `Exception` return `{"error": "Failed to <operation> task"}` with `session.rollback()` — ensure no database connection details are exposed in error messages
- [x] T013 [US2] Audit all 5 tool implementations in `backend/mcp_server.py` — verify every `select(Task)` query includes `.where(Task.user_id == user_id)` — verify `add_task` sets `user_id=user_id` on new Task — confirm no tool has a code path that omits user_id filtering

**Checkpoint**: Calling any tool with User A's ID never returns or modifies User B's tasks. Invalid inputs produce structured error dicts.

---

## Phase 5: User Story 3 — REST API Coexistence (Priority: P2)

**Goal**: MCP server runs alongside existing REST API without breaking Phase 2 functionality.

**Independent Test**: Run existing Phase 2 test suite (`cd backend && pytest`). Create a task via MCP, verify it appears via REST API endpoint (`GET /api/tasks`). Create a task via REST API, verify it appears via `list_tasks` MCP tool.

### Implementation for User Story 3

- [ ] T014 [US3] Verify `backend/main.py` has NO imports or references to `mcp_server.py` — the MCP server is a standalone subprocess, never imported by FastAPI app — if any reference exists, remove it
- [ ] T015 [US3] Verify `backend/routes/tasks.py` is UNCHANGED from Phase 2 — diff against original to confirm zero modifications
- [ ] T016 [US3] Create verification script `backend/test_mcp_tools.py` — a standalone Python script (not pytest) that: (a) imports `db.engine` and `models.Task`, `models.TaskStatus`, `models.Conversation`, `models.Message`; (b) creates a `Session(engine)` and verifies DB connectivity; (c) tests `SQLModel.metadata.create_all(engine)` creates `conversations` and `messages` tables without affecting `tasks` table; (d) performs a round-trip: insert a Task via SQLModel, query it back, delete it; (e) prints PASS/FAIL for each check — run with `python backend/test_mcp_tools.py`

**Checkpoint**: `cd backend && pytest` passes with zero regressions. `python backend/test_mcp_tools.py` prints all PASS.

---

## Phase 6: User Story 4 — OpenRouter LLM Integration Prep (Priority: P2)

**Goal**: Environment configured for OpenRouter. Switching LLM provider requires only env var changes.

**Independent Test**: Verify `.env.example` documents `OPENAI_BASE_URL` and `OPENAI_API_KEY`. Verify no hardcoded API URLs or keys exist in any backend source file.

### Implementation for User Story 4

- [x] T017 [US4] Update `.env.example` at project root — add entries: `OPENAI_BASE_URL=https://openrouter.ai/api/v1` and `OPENAI_API_KEY=sk-or-v1-your-openrouter-key-here` with comments explaining they are used by the OpenAI Agents SDK for LLM provider configuration — if `.env.example` does not exist, create it with all required env vars: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `OPENAI_BASE_URL`, `OPENAI_API_KEY`

**Checkpoint**: `.env.example` documents all required environment variables. No hardcoded secrets in source.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and cleanup

- [ ] T018 Run `mcp dev backend/mcp_server.py` and verify all 5 tools appear in the MCP inspector tool list with correct names and parameter schemas
- [ ] T019 Run quickstart.md validation — follow each step in `specs/003-mcp-server-tools/quickstart.md` and verify expected outcomes match actual results

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 (T006 server shell must exist)
- **US2 (Phase 4)**: Depends on Phase 3 (tools must be implemented before adding validation)
- **US3 (Phase 5)**: Depends on Phase 3 (tools must work before testing coexistence)
- **US4 (Phase 6)**: Can run in parallel with Phase 3-5 (different files)
- **Polish (Phase 7)**: Depends on all previous phases

### Within Each Phase

- Phase 2: T003 → T004 → T005 (enum before models, Conversation before Message FK)
- Phase 2: T006 can run after T003-T005 (needs models imported)
- Phase 3: T007 → T008 → T009 → T010 → T011 (sequential in same file)
- Phase 4: T012 → T013 (add error handling, then audit)
- Phase 5: T014, T015 are verification-only; T016 depends on Phase 3 completion
- Phase 6: T017 is independent (different file)

### Parallel Opportunities

```
Phase 1: T001 → T002 (sequential, same concern)
Phase 2: T003 → T004 → T005 → T006 (sequential, same files)
Phase 3: T007 → T008 → T009 → T010 → T011 (sequential, same file)
Phase 4: T012 → T013 (sequential, same file)

Parallel across phases:
- T017 [US4] can run in parallel with Phase 3-5 (different file: .env.example)
- T014 [US3] and T015 [US3] can run in parallel with Phase 4 (read-only verification)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (`uv add` dependencies)
2. Complete Phase 2: Foundational (models + server shell)
3. Complete Phase 3: User Story 1 (all 5 tools)
4. **STOP and VALIDATE**: Test all tools via `mcp dev backend/mcp_server.py`
5. MVP delivered — AI agent can manage tasks

### Incremental Delivery

1. Phase 1 + Phase 2 → Foundation ready
2. Phase 3 → 5 tools working → MVP!
3. Phase 4 → Error handling + validation hardened
4. Phase 5 → Coexistence verified, test script created
5. Phase 6 → OpenRouter env configured
6. Phase 7 → Full quickstart validation

---

## Task Summary

| Phase | Story | Tasks | Description |
|-------|-------|-------|-------------|
| 1     | —     | T001-T002 | Dependency installation |
| 2     | —     | T003-T006 | Schema extension + server shell |
| 3     | US1   | T007-T011 | 5 MCP tool implementations |
| 4     | US2   | T012-T013 | Error handling + isolation audit |
| 5     | US3   | T014-T016 | Coexistence verification + test script |
| 6     | US4   | T017      | OpenRouter env config |
| 7     | —     | T018-T019 | Polish + quickstart validation |

**Total**: 19 tasks
**MVP scope**: T001-T011 (11 tasks — Phases 1-3)
**Parallel opportunities**: T017 can run alongside Phases 3-5

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- All tools are in `backend/mcp_server.py` (single file) — within Phase 3, tasks are sequential
- `backend/main.py`, `backend/db.py`, `backend/auth.py`, `backend/routes/tasks.py` are NEVER modified
- All new models are APPENDED to `backend/models.py` — existing code untouched
- Stop at any checkpoint to validate independently
