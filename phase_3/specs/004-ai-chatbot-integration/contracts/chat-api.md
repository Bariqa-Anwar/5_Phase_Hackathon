# API Contract: Chat Endpoint

**Feature**: 004-ai-chatbot-integration
**Date**: 2026-02-08
**Protocol**: HTTP REST (FastAPI)
**Base Path**: `/api/{user_id}/chat`

## Endpoint: POST /api/{user_id}/chat

**Description**: Send a natural-language message to the AI chatbot.
The chatbot processes the message using MCP task-management tools and
returns a human-friendly response.

**Authentication**: None (FR-014). User identity is provided via the
`user_id` URL path parameter, matching the MCP tool pattern.

### Path Parameters

| Parameter | Type | Required | Constraints |
|-----------|------|----------|-------------|
| user_id   | str  | Yes      | Non-empty   |

### Request Body

**Content-Type**: `application/json`

```json
{
  "message": "Add a task to buy groceries",
  "conversation_id": null
}
```

| Field           | Type          | Required | Constraints                  |
|-----------------|---------------|----------|------------------------------|
| message         | string        | Yes      | min 1 char, max 10,000 chars |
| conversation_id | integer/null  | No       | Valid conversation ID for this user, or null for new conversation |

### Response (200 OK)

**Content-Type**: `application/json`

```json
{
  "response": "I've added 'buy groceries' to your task list!",
  "conversation_id": 42,
  "message_id": 187
}
```

| Field           | Type    | Description                                 |
|-----------------|---------|---------------------------------------------|
| response        | string  | The assistant's natural-language reply       |
| conversation_id | integer | Conversation ID (newly created or existing)  |
| message_id      | integer | ID of the persisted assistant message        |

### Error Responses

#### 422 Unprocessable Entity — Validation Error

**When**: Empty message or message exceeds 10,000 characters.

```json
{
  "detail": [
    {
      "type": "string_too_short",
      "loc": ["body", "message"],
      "msg": "String should have at least 1 character"
    }
  ]
}
```

#### 404 Not Found — Conversation Not Found

**When**: `conversation_id` is provided but does not exist or belongs
to a different user.

```json
{
  "detail": "Conversation not found"
}
```

#### 200 OK — LLM Error (Graceful)

**When**: The LLM provider is unreachable, times out, or returns an
error. The response is still 200 because the user's message was
persisted and a friendly fallback message is returned.

```json
{
  "response": "I'm having trouble connecting right now. Please try again in a moment.",
  "conversation_id": 42,
  "message_id": 187
}
```

#### 200 OK — Timeout (30s)

**When**: The LLM response takes longer than 30 seconds.

```json
{
  "response": "That request took too long. Please try again with a simpler message.",
  "conversation_id": 42,
  "message_id": 187
}
```

### Behavior Rules

1. **New conversation**: If `conversation_id` is null or omitted, a
   new conversation is created for the user. The new ID is returned
   in the response.

2. **Existing conversation**: If `conversation_id` is provided, the
   system loads the last 50 messages from that conversation as context
   for the AI agent.

3. **Message persistence**: The user's message is ALWAYS persisted
   BEFORE the agent runs. The assistant's response is persisted AFTER
   the agent completes (or a fallback error message is persisted on
   failure).

4. **User isolation**: The `user_id` from the URL path is passed to
   every MCP tool call. The conversation lookup also filters by
   `user_id` to prevent cross-user access.

5. **History limit**: Only the most recent 50 messages are loaded for
   context (FR-011). Older messages are preserved in the database but
   not sent to the LLM.

6. **Timeout**: The agent run is wrapped in a 30-second timeout
   (FR-013). If exceeded, a friendly timeout message is returned.

7. **Error handling**: LLM failures result in a friendly message, not
   a raw error (FR-008). The HTTP status is still 200 because the
   request was partially successful (message persisted).

### Example Flows

#### Flow 1: New Conversation

```
POST /api/user_abc123/chat
{
  "message": "Add a task to buy milk"
}

→ 200 OK
{
  "response": "I've added 'buy milk' to your task list!",
  "conversation_id": 1,
  "message_id": 2
}
```

#### Flow 2: Continue Conversation

```
POST /api/user_abc123/chat
{
  "message": "What are my tasks?",
  "conversation_id": 1
}

→ 200 OK
{
  "response": "Here are your tasks:\n1. buy milk (pending)",
  "conversation_id": 1,
  "message_id": 4
}
```

#### Flow 3: Invalid Conversation

```
POST /api/user_abc123/chat
{
  "message": "Hello",
  "conversation_id": 999
}

→ 404 Not Found
{
  "detail": "Conversation not found"
}
```
