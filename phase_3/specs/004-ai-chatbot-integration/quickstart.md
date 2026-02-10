# Quickstart: AI Chatbot Integration

**Feature**: 004-ai-chatbot-integration
**Date**: 2026-02-08

## Prerequisites

1. Feature 003 (MCP Server Tools) MUST be fully implemented:
   - `backend/models.py` has `Conversation`, `Message`, `MessageRole`
   - `backend/mcp_server.py` exists with all 5 tools working
   - `conversations` and `messages` tables exist in Neon DB

2. Environment variables in `.env` (at project root):
   ```
   DATABASE_URL=postgresql://...
   BETTER_AUTH_SECRET=...
   OPENROUTER_API_KEY=sk-or-v1-...
   OPENROUTER_MODEL=google/gemini-2.0-flash-001
   ```

3. Dependencies installed:
   ```
   cd backend && uv sync
   ```
   Verify `openai-agents` and `mcp[cli]` are in `pyproject.toml`.

## Step 1: Verify MCP Server

```bash
cd backend
python mcp_server.py
```

Expected: Server starts, waits on stdio. Press Ctrl+C to stop.

## Step 2: Start FastAPI Server

```bash
cd backend
uvicorn main:app --reload --port 8000
```

Expected: Server starts on `http://127.0.0.1:8000`. Check
`http://127.0.0.1:8000/health` returns `{"status": "ok"}`.

## Step 3: Test Chat — New Conversation

```bash
curl -X POST "http://127.0.0.1:8000/api/test-user/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "Add a task called Buy groceries"}'
```

Expected response:
```json
{
  "response": "I've added 'Buy groceries' to your task list!",
  "conversation_id": 1,
  "message_id": 2
}
```

Verify:
- `conversation_id` is a positive integer
- `response` contains a natural-language confirmation
- Task exists in DB: `SELECT * FROM tasks WHERE user_id = 'test-user';`

## Step 4: Test Chat — Continue Conversation

```bash
curl -X POST "http://127.0.0.1:8000/api/test-user/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "What are my tasks?", "conversation_id": 1}'
```

Expected:
- Response lists the task created in Step 3
- Same `conversation_id` (1) returned
- History is loaded from DB (not in-memory)

## Step 5: Test Chat — Validation Errors

### Empty message
```bash
curl -X POST "http://127.0.0.1:8000/api/test-user/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": ""}'
```

Expected: 422 Unprocessable Entity

### Invalid conversation
```bash
curl -X POST "http://127.0.0.1:8000/api/test-user/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "conversation_id": 99999}'
```

Expected: 404 Not Found with `"Conversation not found"`

## Step 6: Verify User Isolation

```bash
# Create task for user-A
curl -X POST "http://127.0.0.1:8000/api/user-A/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "Add a task: secret task"}'

# List tasks for user-B (should NOT see user-A's task)
curl -X POST "http://127.0.0.1:8000/api/user-B/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "List my tasks"}'
```

Expected: user-B sees zero tasks (or only their own).

## Step 7: Verify Coexistence with REST API

```bash
# Create task via chat
curl -X POST "http://127.0.0.1:8000/api/test-user/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "Add a task: REST test"}'

# Verify task appears via REST API (requires JWT)
curl -X GET "http://127.0.0.1:8000/api/tasks" \
  -H "Authorization: Bearer <your-jwt-token>"
```

Expected: Task created via chat is visible through REST API (same DB).

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| 500 on chat | Missing `OPENROUTER_API_KEY` | Add key to `.env` |
| Agent returns generic error | Model doesn't support tools | Change `OPENROUTER_MODEL` to a tool-capable model |
| Timeout error | LLM took >30s | Retry or use a faster model |
| MCP tools not discovered | `mcp_server.py` not found | Verify `args` path in MCPServerStdio params |
| DB connection error | Missing `DATABASE_URL` | Add Neon connection string to `.env` |
