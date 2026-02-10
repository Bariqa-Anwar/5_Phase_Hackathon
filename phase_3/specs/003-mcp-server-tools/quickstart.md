# Quickstart: MCP Server Tools

**Feature**: 003-mcp-server-tools
**Date**: 2026-02-08

## Prerequisites

- Python 3.13 (via `.python-version`)
- `uv` package manager installed
- Neon PostgreSQL database with `tasks` table (from Phase 2)
- `.env` file at project root with `DATABASE_URL` set

## 1. Install Dependencies

From the `backend/` directory:

```bash
cd backend
uv add "mcp[cli]" openai-agents
```

This adds the Official MCP SDK and OpenAI Agents SDK to the backend
project.

## 2. Verify Environment

Ensure `.env` at the project root contains:

```env
DATABASE_URL=postgresql://...your-neon-connection-string...
BETTER_AUTH_SECRET=...your-secret...

# New for Phase 3 (agent layer — not needed for MCP tools alone)
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_API_KEY=sk-or-v1-your-openrouter-key
```

## 3. Run the MCP Server (standalone test)

```bash
cd backend
python mcp_server.py
```

The server starts in stdio mode. It reads JSON-RPC messages from
stdin and writes responses to stdout. For interactive testing, use
the MCP CLI inspector:

```bash
mcp dev backend/mcp_server.py
```

## 4. Test a Tool Call

Using the MCP inspector or by sending JSON-RPC via stdin:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "add_task",
    "arguments": {
      "user_id": "test-user-001",
      "title": "Buy groceries",
      "description": "Milk, eggs, bread"
    }
  }
}
```

Expected response:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [{
      "type": "text",
      "text": "{\"id\": 1, \"title\": \"Buy groceries\", ...}"
    }]
  }
}
```

## 5. Verify Coexistence

While the MCP server is running (or after a tool call), verify the
task is visible through the existing REST API:

```bash
curl -H "Authorization: Bearer <jwt-token>" \
     http://localhost:8000/api/tasks
```

The task created via MCP should appear in the REST API response.

## 6. Verify Existing Tests Pass

```bash
cd backend
pytest
```

All Phase 2 tests MUST pass unchanged.

## File Structure After Implementation

```
backend/
├── main.py            # Existing FastAPI app (UNCHANGED)
├── db.py              # Database engine + session (UNCHANGED)
├── auth.py            # JWT middleware (UNCHANGED)
├── models.py          # SQLModel models (EXTENDED — new models added)
├── mcp_server.py      # NEW — MCP server with 5 tools
├── routes/
│   ├── __init__.py    # UNCHANGED
│   └── tasks.py       # UNCHANGED
└── pyproject.toml     # UPDATED — new dependencies
```
