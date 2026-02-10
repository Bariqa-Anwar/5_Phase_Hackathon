# Implementation Plan: AI Chatbot Integration

**Branch**: `004-ai-chatbot-integration` | **Date**: 2026-02-08 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/004-ai-chatbot-integration/spec.md`

## Summary

Implement the AI chatbot endpoint (`POST /api/{user_id}/chat`) using
the OpenAI Agents SDK with an Agent + Runner pattern, connected to
the MCP tools server (`backend/mcp_server.py`) via `MCPServerStdio`
subprocess. The chatbot uses OpenRouter as the LLM provider
(configured via environment variables), follows the stateless request
cycle (History Fetch -> Agent Run -> Save -> Respond), and persists
all conversations to Neon PostgreSQL via SQLModel. The endpoint is
added as a new router (`backend/routes/chat.py`) registered in
`backend/main.py`. No existing endpoints are modified.

## Technical Context

**Language/Version**: Python 3.13 (via `.python-version`)
**Primary Dependencies**: OpenAI Agents SDK (`openai-agents` v0.8.1), FastMCP (`mcp[cli]`), FastAPI 0.128.1, SQLModel 0.0.32
**Storage**: Neon PostgreSQL via `psycopg2-binary` (existing)
**Testing**: pytest (existing dev dependency)
**Target Platform**: Linux server (Vercel/Railway)
**Project Type**: Web application (backend + frontend)
**Performance Goals**: Chat responses within 10 seconds (excluding LLM latency spikes — SC-003). 30-second hard timeout (FR-013).
**Constraints**: No in-memory state; stateless request cycle; no JWT on chat endpoint; user_id in URL path
**Scale/Scope**: 1 new endpoint, 1 new router file, 1 main.py modification (add lifespan + register router), 2 new Pydantic schemas

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. UV Environment Discipline | PASS | All dependencies already added via `uv add` in Feature 003. No new dependencies needed. |
| II. FastAPI Entry Convention | PASS | Chat router registered in `main.py` via `app.include_router()`. `main.py` remains the single entry point. New `routes/chat.py` follows existing routing pattern. |
| III. Spec-Driven Development | PASS | Plan derived from `specs/004-ai-chatbot-integration/spec.md`. Research in `research.md`. |
| IV. Git Guardrails | PASS | No git operations in plan. |
| V. Stateless Architecture | PASS | All history loaded from Neon DB `messages` table per request. No in-memory conversation state. Messages persisted after each interaction. MCP server subprocess is stateless (each tool call is a direct DB operation). |
| VI. AI & MCP Stack | PASS | OpenAI Agents SDK (`Agent` + `Runner`). Official MCP SDK (`MCPServerStdio`). Stateless request cycle: History Fetch -> Agent Run -> Save -> Respond. No LangChain/CrewAI. |
| VII. Deployment Readiness | PASS | `ChatRequest` and `ChatResponse` Pydantic schemas for all I/O. `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` from env vars. No hardcoded secrets. |

## Project Structure

### Documentation (this feature)

```text
specs/004-ai-chatbot-integration/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Technology research & decisions
├── data-model.md        # Entity schemas & API contracts
├── quickstart.md        # Setup & verification guide
├── contracts/
│   └── chat-api.md      # Chat endpoint API contract
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Task breakdown (created by /sp.tasks)
```

### Source Code (repository root)

```text
backend/
├── main.py              # FastAPI app (MODIFIED — add lifespan + chat router)
├── db.py                # Database engine & session (UNCHANGED)
├── auth.py              # JWT middleware (UNCHANGED)
├── models.py            # SQLModel models (UNCHANGED — uses models from Feature 003)
├── mcp_server.py        # MCP server with 5 tools (UNCHANGED — from Feature 003)
├── routes/
│   ├── __init__.py      # UNCHANGED
│   ├── tasks.py         # Task CRUD endpoints (UNCHANGED)
│   └── chat.py          # NEW — Chat endpoint with Agent orchestration
└── pyproject.toml       # UNCHANGED — dependencies already added
```

**Structure Decision**: Add a new router file `backend/routes/chat.py`
following the existing routing pattern. Modify `backend/main.py` to
register the chat router and add the FastAPI lifespan for MCP server
subprocess management. All other files remain unchanged.

## Architecture Decisions

### AD-1: MCP Server as Application-Lifetime Subprocess

The MCP server subprocess is started once when the FastAPI app starts
(via `lifespan` context manager) and shared across all chat requests.
It is NOT spawned per-request.

**Why**: Starting a subprocess per-request adds ~500ms latency. The
`MCPServerStdio` async context manager naturally fits FastAPI's
lifespan pattern. The subprocess runs `backend/mcp_server.py` via
stdio transport, which is the same process from Feature 003.

**Implication**: `main.py` is updated to use a `lifespan` function
instead of the deprecated `@app.on_event("startup")`. The MCP server
instance is stored on `app.state.mcp_server` and accessed by the chat
router.

### AD-2: OpenRouter via Explicit Client Configuration

The OpenAI Agents SDK is configured for OpenRouter using three
explicit calls at module level:
1. `set_default_openai_api("chat_completions")`
2. `set_tracing_disabled(True)`
3. `set_default_openai_client(AsyncOpenAI(base_url=..., api_key=...))`

**Why**: The Agents SDK defaults to the OpenAI Responses API, which
OpenRouter does not support. `OPENAI_BASE_URL` is NOT auto-detected
by the SDK. Explicit configuration is the only reliable approach.
Tracing must be disabled to prevent 401 errors from trace uploads
attempting to reach OpenAI's servers.

**Implication**: Configuration is done once at module import time in
`backend/routes/chat.py`. The `OPENROUTER_API_KEY` is read from the
`.env` file. The model name is configurable via `OPENROUTER_MODEL`
env var.

### AD-3: Manual History Input (No SDK Sessions)

Conversation history is loaded from the Neon DB `messages` table and
passed to `Runner.run()` as a list of dicts. The SDK's built-in
`SQLiteSession` is NOT used.

**Why**: Constitution Principle V mandates all persistence in Neon
PostgreSQL via SQLModel. `SQLiteSession` stores history in local
SQLite, violating stateless architecture. Manual input construction
gives full control over history format and the 50-message limit.

**Implication**: The chat router queries the `messages` table, builds
the input list, and passes it to `Runner.run(agent, input_list)`.
After the run, both user message and assistant response are persisted
to the `messages` table.

### AD-4: Persistence-First Pattern (Save Before Agent Run)

The user's incoming message is persisted to the database BEFORE
`Runner.run()` is called. The assistant's response is saved after.

**Why**: SC-006 requires zero message loss. If the LLM fails, times
out, or the process crashes, the user's message must already be in
the database. This is the only way to guarantee the invariant.

**Implication**: The message flow is: Validate -> Load/Create
Conversation -> Save User Message -> Run Agent -> Save Assistant
Response -> Return Response. On LLM failure, a fallback error message
is saved as the assistant response.

### AD-5: Chat Router as Separate Module

The chat endpoint lives in `backend/routes/chat.py`, registered in
`main.py` via `app.include_router(chat_router)`.

**Why**: Follows the existing routing pattern (`routes/tasks.py`).
Keeps chat logic separate from task CRUD endpoints. The chat endpoint
has a different auth model (no JWT, user_id in URL) and different
dependencies (MCP server, Agent).

### AD-6: Async Endpoint with asyncio.wait_for Timeout

The chat endpoint is `async def` and uses `await Runner.run()` with
`asyncio.wait_for()` for the 30-second timeout.

**Why**: `Runner.run()` is async. The SDK does not have a built-in
timeout parameter. `asyncio.wait_for()` is the standard Python
approach for async timeouts. Using `Runner.run_sync()` in a sync
endpoint would work but blocks the event loop under load.

## Implementation Phases

### Phase 1: OpenRouter Configuration (Setup)

1. Add `OPENROUTER_MODEL` to `.env.example` and verify
   `OPENROUTER_API_KEY` exists in `.env`
2. Create `backend/routes/chat.py` with OpenRouter SDK configuration
   (set_default_openai_api, set_tracing_disabled, set_default_openai_client)
3. Verify configuration loads without errors

### Phase 2: MCP Server Lifespan (Foundational)

1. Update `backend/main.py` to use `lifespan` context manager
2. Start `MCPServerStdio` subprocess in lifespan
3. Store MCP server instance on `app.state.mcp_server`
4. Move existing startup DB check into lifespan
5. Verify server starts and MCP subprocess is reachable

### Phase 3: Chat Endpoint — Core Logic (US1/US2 — P1 MVP)

1. Define `ChatRequest` and `ChatResponse` Pydantic schemas
2. Create `POST /api/{user_id}/chat` endpoint
3. Implement conversation load/create logic
4. Implement history retrieval (last 50 messages)
5. Implement user message persistence (before agent run)
6. Create Agent with system prompt and MCP server
7. Call `Runner.run()` with history + new message
8. Persist assistant response
9. Return `ChatResponse`
10. Register chat router in `main.py`

### Phase 4: Error Handling (US3 — P2)

1. Wrap `Runner.run()` in `asyncio.wait_for()` for 30s timeout
2. Catch `asyncio.TimeoutError` — return friendly timeout message
3. Catch `AgentsException` subtypes — return friendly error message
4. Catch general exceptions — return generic error message
5. Ensure user message is always saved even on failure

### Phase 5: Validation & Edge Cases

1. Validate empty message rejection (min_length=1)
2. Validate long message rejection (max_length=10000)
3. Validate invalid conversation_id returns 404
4. Validate non-task messages get helpful response
5. Verify user isolation (user_A can't see user_B's conversation)

### Phase 6: Provider Configuration (US4 — P2)

1. Verify `OPENROUTER_MODEL` env var is used in Agent constructor
2. Verify changing env vars switches provider with zero code changes
3. Update `.env.example` with all required variables

## Key Design: Chat Router Structure

```python
"""
AI Chatbot endpoint — POST /api/{user_id}/chat
OpenAI Agents SDK + MCP Tools + OpenRouter
"""
import asyncio
import logging
import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Request, status
from openai import AsyncOpenAI
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from agents import (
    Agent,
    Runner,
    set_default_openai_api,
    set_default_openai_client,
    set_tracing_disabled,
)

from db import engine
from models import Conversation, Message, MessageRole

# Load env vars
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# Configure OpenRouter (must be done before any Agent/Runner usage)
set_default_openai_api("chat_completions")
set_tracing_disabled(True)
set_default_openai_client(
    AsyncOpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=os.getenv("OPENROUTER_API_KEY"),
    )
)

OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemini-2.0-flash-001")
HISTORY_LIMIT = 50
AGENT_TIMEOUT = 30.0

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["chat"])


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=10000)
    conversation_id: Optional[int] = None


class ChatResponse(BaseModel):
    response: str
    conversation_id: int
    message_id: int


SYSTEM_PROMPT = """You are a helpful Todo Task Assistant. You help users
manage their tasks using natural language.

You have access to these tools:
- add_task: Create a new task
- list_tasks: List all tasks (optionally filtered by status)
- complete_task: Mark a task as completed
- delete_task: Delete a task
- update_task: Update a task's title or description

Always respond in clear, friendly natural language. When you perform
an action, confirm what you did. When listing tasks, format them in
a readable way."""


@router.post("/{user_id}/chat", response_model=ChatResponse)
async def chat(user_id: str, body: ChatRequest, request: Request):
    mcp_server = request.app.state.mcp_server

    with Session(engine) as session:
        # Load or create conversation
        # Load history (last 50 messages)
        # Save user message
        # Run agent
        # Save assistant response
        # Return response
        ...
```

## Key Design: main.py Lifespan

```python
from contextlib import asynccontextmanager
from agents.mcp import MCPServerStdio

@asynccontextmanager
async def lifespan(app):
    # DB connectivity check (moved from @app.on_event("startup"))
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        result.fetchone()
    logger.info("Database connection successful")

    # Start MCP server subprocess
    async with MCPServerStdio(
        name="Todo Tools",
        params={
            "command": "python",
            "args": ["backend/mcp_server.py"],
        },
        cache_tools_list=True,
    ) as mcp_server:
        app.state.mcp_server = mcp_server
        logger.info("MCP server started")
        yield

    logger.info("MCP server stopped")

app = FastAPI(lifespan=lifespan, ...)
```

## Files Changed Summary

| File | Action | Description |
|------|--------|-------------|
| `backend/routes/chat.py` | NEW | Chat endpoint with Agent orchestration, OpenRouter config, Pydantic schemas |
| `backend/main.py` | MODIFIED | Add lifespan for MCP server, register chat router, remove deprecated `on_event` |

**Files NOT changed** (verified):
- `backend/db.py` — no modifications
- `backend/auth.py` — no modifications
- `backend/models.py` — no modifications (uses Feature 003 models)
- `backend/mcp_server.py` — no modifications (uses Feature 003 implementation)
- `backend/routes/tasks.py` — no modifications
- `backend/routes/__init__.py` — no modifications
- `backend/pyproject.toml` — no modifications (deps already added)

## Dependencies on Feature 003

This feature depends on the following from Feature 003 being complete:

| Artifact | Tasks | Status |
|----------|-------|--------|
| `MessageRole` enum in `models.py` | T003 | Pending |
| `Conversation` model in `models.py` | T004 | Pending |
| `Message` model in `models.py` | T005 | Pending |
| `backend/mcp_server.py` with 5 tools | T006-T011 | Pending |
| `conversations` and `messages` DB tables | Auto-created by T006 | Pending |

**Feature 003 tasks T003-T011 MUST be completed before Feature 004
implementation can begin.**

## Risks

1. **OpenRouter free tier model may not support tool calling** — The
   default model (`google/gemini-2.0-flash-001`) should support it,
   but behavior may vary. Mitigated by making the model configurable
   via `OPENROUTER_MODEL` env var.

2. **MCP subprocess startup latency on cold start** — The first
   request after app startup may be slower while the MCP server
   initializes. Mitigated by starting the subprocess in lifespan
   (before any requests arrive).

3. **Concurrent requests sharing one MCP subprocess** — Multiple
   simultaneous chat requests share the same MCP server subprocess.
   The MCP SDK should handle this via JSON-RPC message IDs, but under
   heavy load there could be queuing. Monitor if this becomes an issue.

## Complexity Tracking

> No Constitution Check violations. No complexity justifications needed.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None      | —          | —                                   |
