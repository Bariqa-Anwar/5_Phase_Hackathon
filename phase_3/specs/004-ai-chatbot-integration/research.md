# Research: AI Chatbot Integration

**Feature**: 004-ai-chatbot-integration
**Date**: 2026-02-08

## R1: OpenAI Agents SDK — Agent + Runner Pattern

**Decision**: Use `Agent` class with system prompt + `Runner.run()`
async invocation.

**Rationale**: The OpenAI Agents SDK (`openai-agents` v0.8.1) provides
a clean Agent abstraction with `Agent(name, instructions, model,
mcp_servers)` and an async `Runner.run(agent, input)` that returns a
`RunResult` with `final_output` containing the text response. The
import path is `from agents import Agent, Runner` (package name is
`agents`, not `openai_agents`).

**Key API**:
```python
from agents import Agent, Runner

agent = Agent(
    name="Todo Assistant",
    instructions="You are a helpful task management assistant...",
    model="google/gemini-2.0-flash-001",
    mcp_servers=[mcp_server],
)

result = await Runner.run(agent, input_messages, max_turns=10)
text = result.final_output
```

**Alternatives considered**:
- LangChain / CrewAI — violates Constitution Principle VI (OpenAI
  Agents SDK only).
- Direct OpenAI API calls — loses tool orchestration and agent loop.
  Rejected for missing core functionality.

## R2: OpenRouter Configuration (Non-OpenAI Provider)

**Decision**: Use `set_default_openai_api("chat_completions")`,
`set_tracing_disabled(True)`, and `set_default_openai_client()` with
a custom `AsyncOpenAI` instance pointing to OpenRouter.

**Rationale**: The OpenAI Agents SDK defaults to the OpenAI Responses
API, which non-OpenAI providers (including OpenRouter) do not support.
Three configuration steps are required:

1. `set_default_openai_api("chat_completions")` — switches to Chat
   Completions API format
2. `set_tracing_disabled(True)` — prevents trace uploads to OpenAI
   (would fail with OpenRouter keys)
3. `set_default_openai_client(AsyncOpenAI(base_url=..., api_key=...))`
   — routes requests to OpenRouter

**Important**: `OPENAI_BASE_URL` is NOT automatically picked up by the
Agents SDK. Explicit client configuration is required.

**Environment variables** (read from `.env`):
```
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=google/gemini-2.0-flash-001
```

**Configuration code**:
```python
from openai import AsyncOpenAI
from agents import set_default_openai_client, set_default_openai_api, set_tracing_disabled

set_default_openai_api("chat_completions")
set_tracing_disabled(True)

client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)
set_default_openai_client(client)
```

**Alternatives considered**:
- LiteLLM adapter (`openai-agents[litellm]`) — adds a dependency and
  another layer. Rejected for unnecessary complexity when direct
  OpenRouter works.
- Setting `OPENAI_BASE_URL` env var — does NOT work with the Agents
  SDK (only works with the raw OpenAI Python client). Rejected.

## R3: MCP Server Subprocess Connection

**Decision**: Use `MCPServerStdio` async context manager to spawn the
MCP server as a subprocess for each request cycle.

**Rationale**: `MCPServerStdio` from `agents.mcp` spawns the MCP
server process and communicates over stdin/stdout via JSON-RPC. The
agent automatically discovers tools by calling `list_tools()`. With
`cache_tools_list=True`, tool definitions are cached across runs
within the same context manager scope.

**Key pattern**:
```python
from agents.mcp import MCPServerStdio

async with MCPServerStdio(
    name="Todo Tools",
    params={
        "command": "python",
        "args": ["backend/mcp_server.py"],
    },
    cache_tools_list=True,
) as server:
    agent = Agent(mcp_servers=[server], ...)
    result = await Runner.run(agent, messages)
```

**Lifecycle decision**: The MCP server subprocess should be started
once at FastAPI application startup (via lifespan) and shared across
requests — NOT spawned per-request. Starting a subprocess per-request
adds ~500ms latency and is wasteful.

**Alternatives considered**:
- `MCPServerStreamableHttp` — requires the MCP server to run as an
  HTTP server on a separate port. More complex for a co-located
  setup. Rejected.
- Per-request subprocess spawn — too slow (~500ms overhead per
  request). Rejected.

## R4: Conversation History — Manual Input List

**Decision**: Build the input message list manually from database
records. Do NOT use the SDK's built-in `SQLiteSession`.

**Rationale**: The spec requires history to be loaded from the Neon
PostgreSQL `messages` table (Constitution Principle V — no in-memory
state). The SDK's `SQLiteSession` stores history in a local SQLite
file, which violates stateless architecture. Instead, we:

1. Query the last 50 messages from the `messages` table
2. Convert them to the format `Runner.run()` expects:
   `[{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]`
3. Append the new user message
4. Pass the full list to `Runner.run(agent, input_list)`

After the run, extract `result.final_output` and persist both the user
message and assistant response to the `messages` table.

**Message format for Runner.run()**:
```python
input_messages = [
    {"role": "user", "content": "Add a task: buy milk"},
    {"role": "assistant", "content": "I've added 'buy milk' to your list."},
    {"role": "user", "content": "What are my tasks?"},  # new message
]
```

**Alternatives considered**:
- SDK `SQLiteSession` — stores in SQLite, violates stateless Neon
  requirement. Rejected.
- `result.to_input_list()` chaining — requires keeping run results
  in memory between requests. Violates stateless architecture.
  Rejected.

## R5: Chat Endpoint Architecture

**Decision**: Create a new router file `backend/routes/chat.py` with
the `POST /api/{user_id}/chat` endpoint. Register it in `main.py`.

**Rationale**: Following the existing routing pattern
(`backend/routes/tasks.py` → registered in `main.py`), the chat
endpoint gets its own router file. This keeps the chat logic separate
from the existing task CRUD endpoints. The chat endpoint does NOT use
JWT auth — `user_id` comes from the URL path (FR-014 from spec).

**Endpoint contract**:
```
POST /api/{user_id}/chat
Body: {"message": "...", "conversation_id": null | int}
Response: {"response": "...", "conversation_id": int, "message_id": int}
```

**Alternatives considered**:
- Adding the endpoint directly to `main.py` — clutters the main file.
  Rejected for code organization.
- Using JWT auth like task endpoints — spec explicitly says no JWT
  (FR-014), user_id is in URL path. Rejected.

## R6: Async Endpoint with Runner.run()

**Decision**: The chat endpoint MUST be `async def` and call
`await Runner.run()` directly.

**Rationale**: `Runner.run()` is async. Using it from an async FastAPI
endpoint is the natural and correct approach. Using `Runner.run_sync()`
inside a sync `def` endpoint would work but blocks the event loop.
Using `Runner.run_sync()` inside an `async def` endpoint would
deadlock.

**Timeout handling**: Use `asyncio.wait_for()` to enforce the 30-second
timeout (FR-013):
```python
import asyncio
result = await asyncio.wait_for(
    Runner.run(agent, messages, max_turns=10),
    timeout=30.0,
)
```

## R7: Error Handling Strategy

**Decision**: Catch `AgentsException` subtypes and
`asyncio.TimeoutError`. Always persist the user's message even on
failure.

**Rationale**: The SDK raises specific exceptions:
- `MaxTurnsExceeded` — agent exceeded max tool-call iterations
- `ModelBehaviorError` — LLM returned malformed output
- `UserError` — SDK API misuse (should not happen in production)
- `asyncio.TimeoutError` — from `asyncio.wait_for()` wrapper

The persistence-first pattern ensures the user's message is saved
BEFORE calling Runner.run(), so it survives any LLM failure (SC-006).

**Error response format** (matches spec FR-008, FR-009):
```json
{
  "response": "I'm having trouble right now. Please try again.",
  "conversation_id": 5,
  "message_id": 12
}
```

## R8: MCP Server Lifespan Management

**Decision**: Use FastAPI's `lifespan` context manager to start and
stop the MCP server subprocess. Store the `MCPServerStdio` instance
in `app.state`.

**Rationale**: The MCP server subprocess should live for the lifetime
of the FastAPI application:
- Started once at startup (avoids per-request spawn overhead)
- Shared across all chat requests
- Gracefully shut down when the app stops

**Pattern**:
```python
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app):
    async with MCPServerStdio(...) as server:
        app.state.mcp_server = server
        yield

app = FastAPI(lifespan=lifespan)
```

**Note**: This replaces the existing `@app.on_event("startup")` pattern
in `main.py` with the modern `lifespan` approach. The existing startup
DB check will be moved into the lifespan function.

**Alternatives considered**:
- Global module-level MCP server — does not work because
  `MCPServerStdio` is an async context manager. Rejected.
- Per-request spawn — ~500ms overhead per request. Rejected.
- Background task / separate process manager — over-engineering.
  Rejected.

## R9: Model Selection for OpenRouter Free Tier

**Decision**: Use `OPENROUTER_MODEL` environment variable with a
default of `google/gemini-2.0-flash-001`.

**Rationale**: OpenRouter provides free-tier access to several models
that support tool/function calling. The model must support the OpenAI
Chat Completions API format with tool_choice. The model name is
configurable via environment variable so switching models requires
zero code changes (US4, FR-012).

**Default model**: `google/gemini-2.0-flash-001` — free on OpenRouter,
supports function/tool calling, fast response times.

**Environment variable**:
```
OPENROUTER_MODEL=google/gemini-2.0-flash-001
```
