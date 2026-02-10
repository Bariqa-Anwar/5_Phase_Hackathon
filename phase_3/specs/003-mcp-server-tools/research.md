# Research: MCP Server Tools

**Feature**: 003-mcp-server-tools
**Date**: 2026-02-08

## R1: MCP Python SDK — Server Pattern

**Decision**: Use `FastMCP` from the official `mcp` package.

**Rationale**: FastMCP is the officially recommended high-level API
for building MCP servers in Python. It provides decorator-based tool
registration (`@mcp.tool()`), automatic JSON Schema generation from
Python type hints, and built-in Pydantic validation for parameters.

**Alternatives considered**:
- Low-level `mcp.server.Server` class — more boilerplate, no auto
  schema generation. Rejected for unnecessary complexity.
- Third-party wrappers — violates Constitution Principle VI (Official
  MCP SDK only).

**Key API pattern**:
```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("todo-tools")

@mcp.tool()
def add_task(user_id: str, title: str, description: str = "") -> dict:
    """Add a new task for the user."""
    # Direct DB operation
    return {"id": 1, "title": title, "status": "pending"}

if __name__ == "__main__":
    mcp.run(transport="stdio")
```

## R2: Transport Protocol

**Decision**: Use `stdio` transport.

**Rationale**: The OpenAI Agents SDK connects to MCP servers via
`MCPServerStdio`, which spawns the MCP server as a subprocess and
communicates over stdin/stdout using JSON-RPC. This is the standard
pattern for local agent-to-tool integration. No HTTP server or port
management needed for the MCP layer.

**Alternatives considered**:
- `streamable-http` transport via `MCPServerStreamableHttp` — adds
  HTTP server complexity, port management, and CORS. Better for
  remote/distributed setups. Rejected because agent and MCP server
  run on the same machine.
- SSE (Server-Sent Events) — deprecated in favor of streamable-http.
  Rejected.

**Integration pattern**:
```python
from agents.mcp import MCPServerStdio

async with MCPServerStdio(
    name="Todo Tools",
    params={
        "command": "python",
        "args": ["backend/mcp_server.py"],
    },
) as server:
    agent = Agent(mcp_servers=[server])
```

## R3: Tool Input Validation

**Decision**: Use `Annotated` type hints with `pydantic.Field` for
parameter validation. Tool functions receive individual parameters
(not a single Pydantic model object).

**Rationale**: FastMCP automatically converts Python type annotations
into JSON Schema. Using `Annotated[str, Field(max_length=200)]`
provides both schema generation and runtime validation. This satisfies
FR-011 (Pydantic validation) while keeping tool signatures clean and
readable for the LLM.

**Alternatives considered**:
- Single Pydantic model parameter per tool — works but makes the
  JSON Schema less readable for the LLM (nested object vs flat
  parameters). Rejected for UX.
- Plain type hints without Field constraints — no validation for
  max_length, min values, etc. Rejected for missing FR-011.

## R4: Tool Output Format

**Decision**: Return plain Python dicts from tool functions. Define
separate Pydantic response models for schema documentation and
serialization consistency.

**Rationale**: FastMCP serializes return values to JSON automatically.
Returning dicts gives direct control over the output structure. The
Pydantic response models (`TaskToolResponse`, `TaskListToolResponse`,
`DeleteToolResponse`) are used for schema documentation and can be
referenced in contracts — but the tool functions themselves return
dicts for simplicity.

## R5: Database Session Management in MCP Tools

**Decision**: Create sessions directly using `Session(engine)` context
manager inside each tool function. Do not use FastAPI's `Depends()`
mechanism.

**Rationale**: MCP tools run outside the FastAPI request lifecycle.
The `get_session()` generator from `db.py` is designed for FastAPI
dependency injection and uses `yield`. Inside MCP tool functions, we
use the same `engine` but create sessions directly:

```python
from db import engine
from sqlmodel import Session

@mcp.tool()
def add_task(user_id: str, title: str) -> dict:
    with Session(engine) as session:
        task = Task(title=title, user_id=user_id)
        session.add(task)
        session.commit()
        session.refresh(task)
        return {"id": task.id, "title": task.title}
```

This reuses the existing connection pool configuration from `db.py`
without modifying any existing code.

## R6: OpenRouter / Custom LLM Base URL

**Decision**: Use environment variables `OPENAI_BASE_URL` and
`OPENAI_API_KEY` to configure the LLM provider. The OpenAI Agents
SDK reads these automatically.

**Rationale**: The OpenAI Python client (used internally by the Agents
SDK) supports `OPENAI_BASE_URL` for custom endpoints. OpenRouter
provides an OpenAI-compatible API at `https://openrouter.ai/api/v1`.
Setting this env var is all that's needed — zero code changes to
switch providers.

**Environment variables**:
```
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_API_KEY=sk-or-v1-your-openrouter-key
```

## R7: Conversation & Message Models (Forward Schema)

**Decision**: Add `Conversation` and `Message` SQLModel classes to
`backend/models.py` now. These are not used by the 5 MCP tools but
are required by Constitution Principle V and will be consumed by the
chatbot orchestration layer in the next feature.

**Rationale**: The constitution mandates persistence for Conversations
and Messages via SQLModel/Neon. Defining the schema now ensures the
database is ready for the ChatKit integration phase without requiring
a migration later.

**Alternatives considered**:
- Defer to next feature — would require a separate schema migration.
  Rejected because adding models now is additive and risk-free.

## R8: Dependency Requirements

**Decision**: Add `mcp[cli]` and `openai-agents` via `uv add` to the
backend project. `sqlmodel` and `psycopg2-binary` are already present.

**Rationale**:
- `mcp[cli]` — provides FastMCP, server runtime, and CLI tools
- `openai-agents` — provides Agent, Runner, MCPServerStdio
- `sqlmodel>=0.0.32` — already in pyproject.toml
- `psycopg2-binary>=2.9.11` — already in pyproject.toml

No `asyncpg` needed — existing sync engine with `psycopg2-binary`
works for MCP tools (they can be sync or async; sync is simpler and
consistent with existing backend patterns).
