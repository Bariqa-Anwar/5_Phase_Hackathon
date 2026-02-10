# Research: Frontend ChatKit Backend Integration

**Feature**: 005-frontend-chatkit-integration
**Date**: 2026-02-08

## R-1: OpenAI ChatKit Availability in Current Frontend

**Question**: Does the frontend use OpenAI ChatKit, and should we adopt it?

**Finding**: The frontend has **no OpenAI ChatKit dependency** (`@openai/chatkit` is not in `package.json`). The user's objectives reference `useChatKit`, `getClientSecret`, and `NEXT_PUBLIC_OPENAI_DOMAIN_KEY` — **none of these exist in the codebase**. The frontend uses a custom fetch-based API client (`frontend/lib/api-client.ts`) with a `useTasks()` React hook pattern.

**Decision**: Build a custom `useChat()` hook following the existing `useTasks()` pattern, and add a `chat.sendMessage()` method to the existing `api` client. Do NOT install OpenAI ChatKit.

**Rationale**:
1. The backend endpoint (`POST /api/{user_id}/chat`) uses a custom request/response contract (`ChatRequest`/`ChatResponse`) — not the OpenAI Assistants API format that ChatKit expects.
2. ChatKit is designed for the OpenAI Assistants API with streaming, threads, and runs. Our backend uses OpenRouter via the Agents SDK — a fundamentally different protocol.
3. Adopting ChatKit would require a backend protocol adapter layer (significant scope creep) or rewriting the backend to match OpenAI's Assistants API (violates spec).
4. The existing `api-client.ts` + React hook pattern is proven, consistent with the rest of the app, and requires no new dependencies.

**Alternatives considered**:
- Install `@openai/chatkit` and configure it with a custom API adapter → Rejected (protocol mismatch, unnecessary complexity).
- Use `ai` (Vercel AI SDK) for streaming → Rejected (backend doesn't support streaming; would require backend changes out of scope).

## R-2: User Identity Resolution for Chat Requests

**Question**: How should the frontend obtain the `user_id` for the `POST /api/{user_id}/chat` path parameter?

**Finding**: The existing `useAuth()` hook (`frontend/lib/hooks/useAuth.ts`) exposes `user.id` from the Better Auth session. The `User` type (`frontend/types/auth.ts:7`) defines `id: string` which matches the JWT `sub` claim and the backend's `user_id` path parameter.

**Decision**: Extract `user.id` from `useAuth()` and use it as the `user_id` path parameter. No mock ID needed — the real auth session is available.

**Rationale**: The auth flow is fully implemented. The JWT token bridge at `/api/auth/token` reads the Better Auth session and mints a JWT with `sub: session.user.id`. The chat endpoint uses `user_id` from the URL path (not from JWT), but both refer to the same identifier.

**Alternatives considered**:
- Use a hardcoded mock user ID → Rejected (auth is already working; no need for mocks).
- Extract `user_id` from the JWT token → Rejected (the backend expects it in the URL path, not the token body; the token is for other protected endpoints).

## R-3: CORS Configuration Status

**Question**: Does the backend need CORS configuration changes?

**Finding**: CORS is **already fully configured** in `backend/main.py:129-138`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Decision**: No CORS changes needed. The backend already allows requests from `http://localhost:3000` (the Next.js dev server).

**Rationale**: The chat endpoint is registered on the same FastAPI app that already has CORS middleware applied globally. All origins, methods, and headers are permissive for the dev environment.

## R-4: Environment Variables for Chat Integration

**Question**: What env vars does the frontend need for chat integration?

**Finding**: The frontend `.env.example` already includes:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```
The existing `api-client.ts` reads `NEXT_PUBLIC_API_URL` and falls back to `http://localhost:8000`. The chat API client will reuse this same variable.

**Decision**: No new environment variables are needed. The existing `NEXT_PUBLIC_API_URL` is sufficient. `NEXT_PUBLIC_OPENAI_DOMAIN_KEY` is NOT needed (ChatKit is not being used).

**Rationale**: The chat endpoint is on the same backend server as the tasks API. Using the same base URL variable keeps configuration simple and consistent.

## R-5: Tool Call Visualization Strategy

**Question**: How should the frontend detect and display tool-call actions?

**Finding**: The backend `ChatResponse` schema returns `{ response: str, conversation_id: int, message_id: int }`. There is no structured `tool_calls` field in the response. The assistant's text response naturally describes actions it took (e.g., "I've created a task called 'Buy groceries'").

**Decision**: Parse the assistant's response text for known action patterns to display visual indicators. Use simple keyword matching on the response text to detect tool actions.

**Rationale**: Adding structured tool-call metadata to the backend response would require modifying Feature 004's endpoint (out of scope for Feature 005). Text-based detection provides a reasonable first implementation. The detection logic can be upgraded if the backend adds structured metadata later.

**Detection patterns**:
- `add_task` / "created a task" / "added a task" → "Task Created" chip
- `list_tasks` / "here are your tasks" / "your tasks" → "Tasks Listed" chip
- `complete_task` / "marked" + "completed" → "Task Completed" chip
- `delete_task` / "deleted" → "Task Deleted" chip
- `update_task` / "updated" → "Task Updated" chip

**Alternatives considered**:
- Modify the backend to return structured `tool_calls` metadata → Rejected (modifies Feature 004 scope; can be done as a follow-up).
- Use no tool call visualization → Rejected (spec FR-006 requires it).

## R-6: Chat Page Routing and Navigation

**Question**: Where should the chat page live in the Next.js app router structure?

**Finding**: The dashboard uses a route group `(dashboard)` with its own layout (`app/(dashboard)/layout.tsx`) that includes the Sidebar and Navbar. The main dashboard page is at `app/(dashboard)/dashboard/page.tsx`. The Sidebar has navigation items pointing to `/dashboard`.

**Decision**: Add the chat page at `app/(dashboard)/chat/page.tsx` within the existing dashboard route group. Add a "Chat" navigation item to the Sidebar.

**Rationale**: Placing the chat page inside the `(dashboard)` route group gives it the same layout (Sidebar + Navbar) as the task dashboard, maintaining visual consistency. The URL will be `/chat`.

## R-7: Conversation ID Persistence Scope

**Question**: How should `conversation_id` be persisted across messages?

**Finding**: The spec states: "The conversation identifier is stored in component state (React state) for the current session. Persistent storage across browser sessions (e.g., localStorage) is out of scope."

**Decision**: Store `conversation_id` in React state within the `useChat()` hook. The ID is set when the backend returns it in the first `ChatResponse` and included in subsequent requests. Starting a new chat resets the ID to `null`.

**Rationale**: React state is the simplest approach that satisfies the spec. No localStorage, no context providers, no URL query parameters needed. The hook manages its own state internally.
