# Data Model: MCP Server Tools

**Feature**: 003-mcp-server-tools
**Date**: 2026-02-08

## Existing Entity: Task (unchanged)

> Source: `backend/models.py:18-43` — NO modifications.

| Field       | Type              | Constraints                          |
|-------------|-------------------|--------------------------------------|
| id          | int (PK)          | Auto-increment                       |
| title       | str               | max_length=200, required             |
| description | str (nullable)    | max_length=2000, optional            |
| status      | TaskStatus (enum) | "pending" / "in_progress" / "completed", default="pending" |
| user_id     | str               | max_length=255, indexed              |
| created_at  | datetime          | Auto-set on creation (UTC)           |
| updated_at  | datetime          | Auto-set on creation, updated on mutation (UTC) |

**Indexes**:
- `ix_tasks_user_id_id` — composite (user_id, id) for user-scoped lookups
- `user_id` — standalone index for filtering

**Status transitions**: Any status can transition to any other status.
`complete_task` specifically sets status to "completed".

## New Entity: Conversation

> To be added to `backend/models.py` — forward schema for chatbot layer.

| Field      | Type           | Constraints                     |
|------------|----------------|---------------------------------|
| id         | int (PK)       | Auto-increment                  |
| user_id    | str            | max_length=255, indexed, required |
| title      | str (nullable) | max_length=200, optional        |
| created_at | datetime       | Auto-set on creation (UTC)      |
| updated_at | datetime       | Auto-set on creation/mutation (UTC) |

**Table name**: `conversations`
**Indexes**: `user_id` — for user-scoped queries
**Purpose**: Groups a sequence of messages into a single chat session.
Each user can have multiple conversations.

## New Entity: Message

> To be added to `backend/models.py` — forward schema for chatbot layer.

| Field           | Type             | Constraints                          |
|-----------------|------------------|--------------------------------------|
| id              | int (PK)         | Auto-increment                       |
| conversation_id | int (FK)         | References conversations.id, required |
| role            | MessageRole (enum) | "user" / "assistant" / "system" / "tool" |
| content         | str              | Text content, required               |
| tool_name       | str (nullable)   | MCP tool name (for role="tool")      |
| tool_call_id    | str (nullable)   | Correlation ID for tool calls        |
| created_at      | datetime         | Auto-set on creation (UTC)           |

**Table name**: `messages`
**Indexes**:
- `conversation_id` — for fetching messages in a conversation
- Composite `(conversation_id, created_at)` — for ordered history fetch

**Purpose**: Stores individual messages within a conversation. Supports
the stateless request cycle: History Fetch (read messages by
conversation_id) -> Agent Run -> Save (append new messages) -> Respond.

## New Enum: MessageRole

| Value       | Description                              |
|-------------|------------------------------------------|
| "user"      | Message from the human user              |
| "assistant" | Response from the AI agent               |
| "system"    | System instruction/prompt                |
| "tool"      | Output from an MCP tool invocation       |

## MCP Tool Input Schemas (Pydantic via Annotated)

These are not database models — they define the validated input
parameters for each MCP tool function.

### add_task

| Parameter   | Type | Required | Constraints      |
|-------------|------|----------|------------------|
| user_id     | str  | Yes      | Non-empty        |
| title       | str  | Yes      | max_length=200   |
| description | str  | No       | max_length=2000, default="" |

### list_tasks

| Parameter | Type | Required | Constraints                              |
|-----------|------|----------|------------------------------------------|
| user_id   | str  | Yes      | Non-empty                                |
| status    | str  | No       | One of: "pending", "in_progress", "completed" |

### complete_task

| Parameter | Type | Required | Constraints |
|-----------|------|----------|-------------|
| user_id   | str  | Yes      | Non-empty   |
| task_id   | int  | Yes      | > 0         |

### delete_task

| Parameter | Type | Required | Constraints |
|-----------|------|----------|-------------|
| user_id   | str  | Yes      | Non-empty   |
| task_id   | int  | Yes      | > 0         |

### update_task

| Parameter   | Type | Required | Constraints                              |
|-------------|------|----------|------------------------------------------|
| user_id     | str  | Yes      | Non-empty                                |
| task_id     | int  | Yes      | > 0                                      |
| title       | str  | No       | max_length=200                           |
| description | str  | No       | max_length=2000                          |

**Validation rule**: At least one of `title` or `description` MUST be
provided. If both are omitted, the tool MUST return an error.

## MCP Tool Output Schema

All tools return a consistent JSON structure:

### Success (single task)
```json
{
  "id": 42,
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "status": "pending",
  "user_id": "user_abc123",
  "created_at": "2026-02-08T12:00:00",
  "updated_at": "2026-02-08T12:00:00"
}
```

### Success (task list)
```json
{
  "tasks": [
    { "id": 42, "title": "...", "status": "pending", ... },
    { "id": 43, "title": "...", "status": "completed", ... }
  ],
  "count": 2
}
```

### Success (delete confirmation)
```json
{
  "deleted": true,
  "task_id": 42
}
```

### Error
```json
{
  "error": "Task not found"
}
```

## Entity Relationships

```
User (external, identified by user_id string)
 ├── Task (1:N) — user_id field
 └── Conversation (1:N) — user_id field
      └── Message (1:N) — conversation_id FK
```
