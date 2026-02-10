# API Contract: Chat Integration (Frontend → Backend)

**Feature**: 005-frontend-chatkit-integration
**Date**: 2026-02-08

## Endpoint: Send Chat Message

**Method**: `POST`
**URL**: `{NEXT_PUBLIC_API_URL}/api/{user_id}/chat`
**Auth**: None (user_id in path serves as identifier; no JWT required on this endpoint)

### Path Parameters

| Parameter | Type   | Required | Description                          |
|-----------|--------|----------|--------------------------------------|
| `user_id` | string | Yes      | User identifier from auth session (`user.id`) |

### Request Body

```typescript
interface ChatRequest {
  message: string;          // 1-10000 characters
  conversation_id?: number; // null for new conversation, number to continue existing
}
```

**Content-Type**: `application/json`

### Response (200 OK)

```typescript
interface ChatResponse {
  response: string;         // Assistant's text response
  conversation_id: number;  // Conversation ID (created or existing)
  message_id: number;       // ID of the saved assistant message
}
```

### Error Responses

| Status | Condition                        | Body                                 |
|--------|----------------------------------|--------------------------------------|
| 404    | `conversation_id` not found or doesn't belong to user | `{ "detail": "Conversation not found" }` |
| 422    | Invalid request body (empty message, message too long) | `{ "detail": [...] }` (Pydantic validation errors) |
| 500    | Server error                     | `{ "detail": "..." }` |

### Frontend API Client Method

```typescript
// In frontend/lib/api-client.ts

chat: {
  sendMessage: async (
    userId: string,
    message: string,
    conversationId?: number
  ): Promise<ChatResponse> => {
    const body: ChatRequest = { message };
    if (conversationId != null) {
      body.conversation_id = conversationId;
    }

    const res = await fetch(
      `${API_BASE_URL}/api/${userId}/chat`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Chat request failed: ${res.status}`);
    }

    return res.json();
  },
}
```

### Notes

- This endpoint does NOT use JWT authentication. The `user_id` is passed directly in the URL path.
- The frontend does NOT need to call `getAuthHeader()` for this endpoint (unlike task endpoints which use JWT).
- The `conversation_id` should be `undefined`/omitted for the first message in a new conversation. The backend creates a new conversation and returns the `conversation_id` in the response.
- Subsequent messages in the same conversation MUST include the `conversation_id` from the previous response.
