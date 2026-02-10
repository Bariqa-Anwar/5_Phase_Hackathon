# Data Model: AI Chatbot Integration

**Feature**: 004-ai-chatbot-integration
**Date**: 2026-02-08

## Existing Entities (from Feature 003 — unchanged)

### Task

> Source: `backend/models.py:18-43` — NO modifications.

Used by MCP tools for CRUD operations. The chatbot interacts with
tasks exclusively through MCP tool calls — never directly.

### Conversation

> Source: to be added to `backend/models.py` by Feature 003 T004
> (forward schema). Used by Feature 004 for chat session tracking.

| Field      | Type           | Constraints                       |
|------------|----------------|-----------------------------------|
| id         | int (PK)       | Auto-increment                    |
| user_id    | str            | max_length=255, indexed, required |
| title      | str (nullable) | max_length=200, optional          |
| created_at | datetime       | Auto-set on creation (UTC)        |
| updated_at | datetime       | Auto-set on creation/mutation     |

**Table name**: `conversations`

### Message

> Source: to be added to `backend/models.py` by Feature 003 T005
> (forward schema). Used by Feature 004 for conversation history.

| Field           | Type               | Constraints                     |
|-----------------|--------------------|---------------------------------|
| id              | int (PK)           | Auto-increment                  |
| conversation_id | int (FK)           | References conversations.id     |
| role            | MessageRole (enum) | "user" / "assistant" / "system" / "tool" |
| content         | str                | Text content, required          |
| tool_name       | str (nullable)     | MCP tool name (role="tool")     |
| tool_call_id    | str (nullable)     | Correlation ID for tool calls   |
| created_at      | datetime           | Auto-set on creation (UTC)      |

**Table name**: `messages`
**Key index**: composite `(conversation_id, created_at)` for ordered
history retrieval.

### MessageRole (enum)

| Value       | Used By Feature 004                             |
|-------------|--------------------------------------------------|
| "user"      | Incoming chat messages from the user             |
| "assistant" | AI agent responses persisted after Runner.run()  |
| "system"    | Not used directly (agent instructions are inline)|
| "tool"      | Not persisted by chat endpoint (internal to SDK) |

## New Pydantic Schemas (Feature 004)

These are request/response models for the chat API endpoint — NOT
database models. They go in the new `backend/routes/chat.py` file
(or can be added to `backend/models.py` if preferred).

### ChatRequest

| Field           | Type           | Required | Constraints          |
|-----------------|----------------|----------|----------------------|
| message         | str            | Yes      | min_length=1, max_length=10000 |
| conversation_id | int (nullable) | No       | Must reference existing conversation if provided |

**Validation rules**:
- Empty message → 422 with "Message cannot be empty" (FR-010)
- Message > 10,000 chars → 422 with "Message too long" (FR-010)
- Invalid conversation_id → 404 "Conversation not found" (edge case)

### ChatResponse

| Field           | Type | Description                            |
|-----------------|------|----------------------------------------|
| response        | str  | The assistant's natural-language reply |
| conversation_id | int  | ID of the conversation (new or existing)|
| message_id      | int  | ID of the persisted assistant message  |

## Entity Relationships (Full System)

```
User (external, identified by user_id string)
 ├── Task (1:N) — user_id field (managed by MCP tools)
 └── Conversation (1:N) — user_id field
      └── Message (1:N) — conversation_id FK
           ├── role="user"      (from chat endpoint)
           └── role="assistant" (from Runner.run() result)
```

## Data Flow: Chat Request Cycle

```
1. POST /api/{user_id}/chat
   └── Body: ChatRequest {message, conversation_id?}

2. Load/Create Conversation
   ├── If conversation_id provided → SELECT from conversations WHERE id AND user_id
   └── If null → INSERT new conversation for user_id

3. Load History
   └── SELECT last 50 messages FROM messages WHERE conversation_id ORDER BY created_at ASC

4. Save User Message (BEFORE agent run — ensures no message loss)
   └── INSERT INTO messages (conversation_id, role="user", content=message)

5. Run Agent
   └── Runner.run(agent, history + new_message, max_turns=10)

6. Save Assistant Response
   └── INSERT INTO messages (conversation_id, role="assistant", content=result.final_output)

7. Return ChatResponse
   └── {response, conversation_id, message_id}
```

**Note**: The user message is persisted at step 4 BEFORE the agent
runs (step 5). This guarantees zero message loss even if the LLM
fails (SC-006).
