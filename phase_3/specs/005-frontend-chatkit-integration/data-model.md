# Data Model: Frontend ChatKit Backend Integration

**Feature**: 005-frontend-chatkit-integration
**Date**: 2026-02-08

## Frontend Entities

### ChatMessage (Frontend-only type)

Represents a single message displayed in the chat UI. This is a frontend-only type — not a database model.

| Field        | Type                       | Description                                    |
|--------------|----------------------------|------------------------------------------------|
| `id`         | `string`                   | Unique identifier (generated client-side for optimistic messages, replaced by `message_id` from backend) |
| `role`       | `"user" \| "assistant"`    | Who sent the message                           |
| `content`    | `string`                   | The message text                               |
| `toolCalls`  | `ToolCallAction[]`         | Parsed tool-call indicators (empty for user messages and plain assistant replies) |
| `timestamp`  | `Date`                     | When the message was created                   |
| `status`     | `"sending" \| "sent" \| "error"` | Message delivery status for UI feedback |

### ToolCallAction (Frontend-only type)

Represents a detected tool action for visual display.

| Field    | Type     | Description                                       |
|----------|----------|---------------------------------------------------|
| `action` | `string` | The tool action type: `"task_created"`, `"tasks_listed"`, `"task_completed"`, `"task_deleted"`, `"task_updated"` |
| `label`  | `string` | Human-readable label: `"Task Created"`, `"Tasks Listed"`, etc. |

### ChatState (Hook internal state)

| Field             | Type                | Description                                |
|-------------------|---------------------|--------------------------------------------|
| `messages`        | `ChatMessage[]`     | All messages in the current conversation   |
| `conversationId`  | `number \| null`    | Backend conversation ID (null for new chat)|
| `isLoading`       | `boolean`           | True while waiting for backend response    |
| `error`           | `string \| null`    | Error message from last failed request     |

## Backend Entities (Existing — No Changes)

These entities are defined in `backend/models.py` and `backend/routes/chat.py`. They are NOT modified by this feature.

### ChatRequest (Backend Pydantic schema — existing)

| Field             | Type            | Validation         | Description                     |
|-------------------|-----------------|--------------------|---------------------------------|
| `message`         | `str`           | min=1, max=10000   | User's message text             |
| `conversation_id` | `Optional[int]` | —                  | Existing conversation to continue |

### ChatResponse (Backend Pydantic schema — existing)

| Field             | Type   | Description                              |
|-------------------|--------|------------------------------------------|
| `response`        | `str`  | Assistant's response text                |
| `conversation_id` | `int`  | Conversation ID (new or existing)        |
| `message_id`      | `int`  | ID of the saved assistant message        |

## Request/Response Flow

```
Frontend (useChat hook)          Backend (POST /api/{user_id}/chat)
─────────────────────────        ──────────────────────────────────
1. User types message
2. Add optimistic user msg
3. POST to backend ──────────→  4. Validate ChatRequest
                                 5. Load/create conversation
                                 6. Load history (50 msgs)
                                 7. Save user message
                                 8. Run Agent (MCP tools)
                                 9. Save assistant message
10. Receive ChatResponse ←────  10. Return ChatResponse
11. Add assistant msg to state
12. Store conversation_id
13. Parse tool-call indicators
14. Update UI
```
