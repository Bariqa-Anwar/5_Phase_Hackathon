# MCP Tool Contracts: MCP Server Tools

**Feature**: 003-mcp-server-tools
**Date**: 2026-02-08
**Protocol**: Model Context Protocol (MCP) via FastMCP
**Transport**: stdio (JSON-RPC over stdin/stdout)

## Server Identity

- **Name**: `todo-tools`
- **Entry point**: `backend/mcp_server.py`
- **Run command**: `python backend/mcp_server.py`

## Tool: add_task

**Description**: Add a new task for the specified user.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "user_id": { "type": "string", "minLength": 1 },
    "title": { "type": "string", "maxLength": 200 },
    "description": { "type": "string", "maxLength": 2000, "default": "" }
  },
  "required": ["user_id", "title"]
}
```

**Output**: Task record JSON with all fields (id, title, description,
status, user_id, created_at, updated_at).

**Behavior**:
- Creates task with status="pending"
- Sets created_at and updated_at to current UTC time
- Returns the full task record including auto-assigned ID

**Error cases**:
- Title exceeds 200 chars → validation error
- Description exceeds 2000 chars → validation error
- Missing user_id → validation error
- Database error → `{"error": "Failed to create task"}`

---

## Tool: list_tasks

**Description**: List tasks for the specified user, optionally filtered
by status.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "user_id": { "type": "string", "minLength": 1 },
    "status": {
      "type": "string",
      "enum": ["pending", "in_progress", "completed"]
    }
  },
  "required": ["user_id"]
}
```

**Output**: `{"tasks": [...], "count": N}`

**Behavior**:
- Filters tasks by user_id (mandatory)
- When status provided, additionally filters by status
- Orders results by created_at descending (newest first)
- Returns all matching tasks (no pagination limit for MCP — agent
  context window is the natural limit)

**Error cases**:
- Invalid status value → validation error
- Missing user_id → validation error
- Database error → `{"error": "Failed to list tasks"}`

---

## Tool: complete_task

**Description**: Mark a specific task as completed.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "user_id": { "type": "string", "minLength": 1 },
    "task_id": { "type": "integer", "minimum": 1 }
  },
  "required": ["user_id", "task_id"]
}
```

**Output**: Updated task record JSON with status="completed".

**Behavior**:
- Looks up task by task_id AND user_id (user isolation)
- Sets status to "completed"
- Updates updated_at to current UTC time
- If task is already completed, returns it unchanged (idempotent)
- Returns the full updated task record

**Error cases**:
- Task not found (wrong ID or wrong user) → `{"error": "Task not found"}`
- Missing user_id or task_id → validation error
- Database error → `{"error": "Failed to complete task"}`

---

## Tool: delete_task

**Description**: Permanently delete a specific task.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "user_id": { "type": "string", "minLength": 1 },
    "task_id": { "type": "integer", "minimum": 1 }
  },
  "required": ["user_id", "task_id"]
}
```

**Output**: `{"deleted": true, "task_id": N}`

**Behavior**:
- Looks up task by task_id AND user_id (user isolation)
- Permanently removes the task from the database
- Returns confirmation with the deleted task's ID

**Error cases**:
- Task not found (wrong ID or wrong user) → `{"error": "Task not found"}`
- Missing user_id or task_id → validation error
- Database error → `{"error": "Failed to delete task"}`

---

## Tool: update_task

**Description**: Update the title and/or description of a specific task.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "user_id": { "type": "string", "minLength": 1 },
    "task_id": { "type": "integer", "minimum": 1 },
    "title": { "type": "string", "maxLength": 200 },
    "description": { "type": "string", "maxLength": 2000 }
  },
  "required": ["user_id", "task_id"]
}
```

**Output**: Updated task record JSON with all fields.

**Behavior**:
- Looks up task by task_id AND user_id (user isolation)
- Updates only the fields that are provided (partial update)
- At least one of title or description MUST be provided
- Updates updated_at to current UTC time
- Returns the full updated task record

**Error cases**:
- Task not found (wrong ID or wrong user) → `{"error": "Task not found"}`
- Neither title nor description provided → `{"error": "At least one of title or description must be provided"}`
- Title exceeds 200 chars → validation error
- Description exceeds 2000 chars → validation error
- Database error → `{"error": "Failed to update task"}`

---

## User Isolation Contract

**Invariant**: Every tool query MUST include
`WHERE user_id = :user_id` (or equivalent SQLModel filter).

**Enforcement**: The `user_id` parameter is required on every tool.
Tool implementations MUST use it in every database query. There is no
fallback or default user_id.

**Verification**: Calling any tool with User A's user_id MUST never
return, modify, or delete tasks belonging to User B.
