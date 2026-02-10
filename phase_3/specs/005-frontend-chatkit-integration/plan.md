# Implementation Plan: Frontend ChatKit Backend Integration

**Branch**: `005-frontend-chatkit-integration` | **Date**: 2026-02-08 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/005-frontend-chatkit-integration/spec.md`

## Summary

Connect the existing Next.js frontend to the verified backend chatbot
endpoint (`POST /api/{user_id}/chat`). The frontend does NOT use OpenAI
ChatKit — it uses a custom fetch-based API client with React hooks. This
plan adds a `chat.sendMessage()` method to the existing API client, creates
a `useChat()` hook following the `useTasks()` pattern, builds a chat page
at `/chat` within the dashboard layout, and implements client-side
tool-call detection for visual action indicators. No backend changes are
required — CORS, the chat endpoint, and environment variables are already
configured.

## Critical Finding: No OpenAI ChatKit

The user's objectives reference `useChatKit`, `getClientSecret`, and
`NEXT_PUBLIC_OPENAI_DOMAIN_KEY`. **None of these exist in the codebase.**
The frontend uses:

- **API client**: `frontend/lib/api-client.ts` — custom fetch wrapper
- **Hooks**: `frontend/lib/hooks/useTasks.ts` — React state + api calls
- **Auth**: Better Auth via `useAuth()` hook — exposes `user.id`
- **Env vars**: `NEXT_PUBLIC_API_URL` — already set to `http://localhost:8000`

**Resolution**: Build integration using the existing patterns. No ChatKit
installation, no `getClientSecret`, no `NEXT_PUBLIC_OPENAI_DOMAIN_KEY`.
See [research.md](research.md) R-1 for full analysis.

## Technical Context

**Language/Version**: TypeScript 5.x (Next.js 16.1.6, React 19.2.3)
**Primary Dependencies**: next, react, better-auth, lucide-react, tailwind-merge, clsx (all existing — no new deps)
**Storage**: N/A (conversation state in React component state; backend handles DB persistence)
**Testing**: Manual (no frontend test framework in package.json)
**Target Platform**: Web browser (Next.js app served at localhost:3000)
**Project Type**: Web application (frontend + backend)
**Performance Goals**: Chat response visible within 10 seconds (SC-001)
**Constraints**: No backend modifications; no new dependencies; preserve existing task UI; user_id from auth session
**Scale/Scope**: 5 new files, 2 modified files, 2 new TypeScript types

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. UV Environment Discipline | N/A | Frontend-only feature. No Python dependencies. No `pip` or `uv` operations. |
| II. FastAPI Entry Convention | PASS | No backend changes. `main.py` is unchanged. |
| III. Spec-Driven Development | PASS | Plan derived from `specs/005-frontend-chatkit-integration/spec.md`. Research in `research.md`. |
| IV. Git Guardrails | PASS | No git operations in plan. |
| V. Stateless Architecture | PASS | Frontend holds conversation state in React state only for UI display. All persistence is handled by the backend's Neon PostgreSQL (unchanged). |
| VI. AI & MCP Stack | PASS | No changes to the AI/MCP stack. Frontend consumes the existing endpoint. |
| VII. Deployment Readiness | PASS | TypeScript types for all request/response models. Environment variables from existing `.env.example` (no new vars needed). |

## Project Structure

### Documentation (this feature)

```text
specs/005-frontend-chatkit-integration/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Technology research & decisions
├── data-model.md        # Entity schemas & API contracts
├── quickstart.md        # Setup & verification guide
├── contracts/
│   └── chat-api.md      # Chat endpoint API contract
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Task breakdown (created by /sp.tasks)
```

### Source Code (repository root)

```text
frontend/
├── lib/
│   ├── api-client.ts          # MODIFIED — add chat.sendMessage() method
│   └── hooks/
│       └── useChat.ts         # NEW — chat hook (send, messages, state)
├── types/
│   └── chat.ts                # NEW — ChatMessage, ChatResponse, ToolCallAction types
├── components/
│   ├── layout/
│   │   └── Sidebar.tsx        # MODIFIED — add "Chat" nav item
│   └── chat/
│       ├── ChatWindow.tsx     # NEW — main chat container (message list + input)
│       ├── MessageBubble.tsx  # NEW — individual message display with tool-call chips
│       └── ChatInput.tsx      # NEW — text input with send button and char counter
├── app/
│   └── (dashboard)/
│       └── chat/
│           └── page.tsx       # NEW — chat page route
└── .env.example               # MODIFIED — add comment for chat API (already has NEXT_PUBLIC_API_URL)

backend/                       # NO CHANGES
```

**Structure Decision**: All new code is in the frontend. The chat components
follow the existing dashboard component pattern. The `useChat()` hook
follows the `useTasks()` pattern. The API client extension reuses the
existing `api` object pattern.

## Architecture Decisions

### AD-1: Custom Chat Hook Instead of ChatKit

Build `useChat()` following the existing `useTasks()` pattern instead of
installing OpenAI ChatKit.

**Why**: The backend uses a custom `ChatRequest`/`ChatResponse` protocol
(not the OpenAI Assistants API). ChatKit is designed for OpenAI's
Assistants API with streaming, threads, and runs — a fundamentally
different protocol. Using ChatKit would require a protocol adapter layer
(significant scope creep) or backend changes (violates constraints).

**Implication**: All chat state management is hand-written in a React hook.
This is consistent with the existing `useTasks()` approach and requires
no new dependencies.

### AD-2: No JWT for Chat Endpoint

The `chat.sendMessage()` API client method does NOT include a JWT
`Authorization` header. The backend chat endpoint uses `user_id` from the
URL path, not from a JWT token.

**Why**: The chat endpoint at `POST /api/{user_id}/chat` was designed
(Feature 004) without JWT auth — the `user_id` is the path parameter.
The existing task endpoints use JWT via `getAuthHeader()`, but the chat
endpoint does not.

**Implication**: The API client method for chat uses a simpler request
without the auth header. The `user_id` is obtained from `useAuth()` →
`user.id` and inserted into the URL path.

### AD-3: Text-Based Tool Call Detection

Detect tool-call actions by parsing known patterns in the assistant's
response text rather than using structured metadata.

**Why**: The `ChatResponse` schema does not include a `tool_calls` field.
Adding one would require modifying the backend (out of scope). The
assistant's natural language responses consistently describe the actions
it performed. Text-based detection is a pragmatic first implementation.

**Implication**: A `parseToolCalls(text: string): ToolCallAction[]` utility
function scans the response text for known keywords/phrases. This is
best-effort and may miss unusual phrasings. Can be upgraded to structured
metadata when the backend adds it.

### AD-4: Chat Page in Dashboard Route Group

The chat page lives at `app/(dashboard)/chat/page.tsx` inside the existing
dashboard route group.

**Why**: The `(dashboard)` route group provides the Sidebar + Navbar layout.
Placing the chat page here gives it consistent navigation and layout
without duplicating the shell. The URL path is `/chat`.

**Implication**: The Sidebar must be updated to include a "Chat" navigation
item. The chat page automatically inherits the dashboard layout.

### AD-5: Conversation State in React Hook

`conversation_id` is stored in the `useChat()` hook's React state. It is
NOT stored in localStorage, URL params, or a React context.

**Why**: The spec explicitly states localStorage is out of scope. React
state is the simplest approach. The hook creates an encapsulated state
machine: `null` (new chat) → `number` (ongoing chat) → `null` (new chat
button). This is consistent with how `useTasks()` manages its state.

**Implication**: Refreshing the page or navigating away resets the
conversation. This is acceptable per spec — the backend retains the full
conversation history in PostgreSQL, and the frontend only tracks the
current session's conversation ID.

## Implementation Phases

### Phase 1: TypeScript Types (Foundation)

1. Create `frontend/types/chat.ts` with:
   - `ChatMessage` interface (id, role, content, toolCalls, timestamp, status)
   - `ChatResponse` interface (response, conversation_id, message_id)
   - `ChatRequest` interface (message, conversation_id?)
   - `ToolCallAction` interface (action, label)
   - `CHAT_CONSTRAINTS` const (MESSAGE_MAX_LENGTH: 10000)

### Phase 2: API Client Extension

1. Add `chat.sendMessage(userId, message, conversationId?)` to `frontend/lib/api-client.ts`
2. Method signature: `async (userId: string, message: string, conversationId?: number) => Promise<ChatResponse>`
3. Uses `POST ${API_BASE_URL}/api/${userId}/chat` — no JWT auth header
4. Error handling follows existing pattern (parse `detail` from response)

### Phase 3: Tool Call Parser Utility

1. Create `parseToolCalls(text: string): ToolCallAction[]` in `frontend/lib/chat-utils.ts` (or inline in useChat)
2. Pattern matching:
   - "created" / "added" + "task" → `{ action: "task_created", label: "Task Created" }`
   - "here are" / "your tasks" / "tasks:" → `{ action: "tasks_listed", label: "Tasks Listed" }`
   - "completed" / "marked" + "complete" → `{ action: "task_completed", label: "Task Completed" }`
   - "deleted" / "removed" → `{ action: "task_deleted", label: "Task Deleted" }`
   - "updated" / "changed" → `{ action: "task_updated", label: "Task Updated" }`

### Phase 4: useChat Hook (Core Logic — FR-002, FR-004, FR-005, FR-007, FR-012)

1. Create `frontend/lib/hooks/useChat.ts`
2. State: `messages`, `conversationId`, `isLoading`, `error`
3. `sendMessage(text: string)`:
   - Validate non-empty and within max length
   - Add optimistic user message to state (status: "sending")
   - Call `api.chat.sendMessage(userId, text, conversationId)`
   - On success: add assistant message with parsed tool calls, update conversationId, mark user msg "sent"
   - On error: set error state, mark user msg "error"
4. `resetChat()`: clear messages, set conversationId to null
5. Return: `{ messages, isLoading, error, sendMessage, resetChat, conversationId }`

### Phase 5: Chat UI Components (FR-001, FR-003, FR-006, FR-007, FR-008, FR-009)

1. **ChatInput.tsx** (`frontend/components/chat/ChatInput.tsx`):
   - Text input (textarea) with send button
   - Character counter (shows `{current}/{max}` near the limit)
   - Disable send when empty, exceeding limit, or loading
   - Send on Enter (Shift+Enter for newline)

2. **MessageBubble.tsx** (`frontend/components/chat/MessageBubble.tsx`):
   - User messages: right-aligned, blue background
   - Assistant messages: left-aligned, gray background
   - Tool call chips: colored badges below assistant message text
   - Loading state: animated dots for in-flight assistant response
   - Error state: red-tinted message with retry option

3. **ChatWindow.tsx** (`frontend/components/chat/ChatWindow.tsx`):
   - Container: flex column, full height within dashboard layout
   - Header: "Chat" title + "New Chat" button (calls `resetChat()`)
   - Message list: scrollable area, auto-scrolls to bottom on new messages
   - Footer: ChatInput component
   - Error banner: dismissable error message
   - Empty state: welcome message with usage suggestions

### Phase 6: Chat Page & Navigation (FR-001)

1. **Chat page** (`frontend/app/(dashboard)/chat/page.tsx`):
   - Uses `useAuth()` to get `user.id`
   - Passes `userId` to `useChat()` hook
   - Renders `ChatWindow` with hook state
   - Redirects to login if not authenticated

2. **Sidebar update** (`frontend/components/layout/Sidebar.tsx`):
   - Add `{ href: "/chat", label: "Chat", icon: MessageCircle }` to `navItems`
   - Import `MessageCircle` from `lucide-react`

### Phase 7: Environment Documentation (FR-010)

1. Update `frontend/.env.example` to add a comment clarifying chat uses the same `NEXT_PUBLIC_API_URL`:
   ```
   # Backend API (used for both task CRUD and AI chat)
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

## Files Changed Summary

| File | Action | Description |
|------|--------|-------------|
| `frontend/types/chat.ts` | NEW | Chat message, response, and tool-call types |
| `frontend/lib/api-client.ts` | MODIFIED | Add `chat.sendMessage()` method |
| `frontend/lib/hooks/useChat.ts` | NEW | Chat hook with message state management |
| `frontend/components/chat/ChatWindow.tsx` | NEW | Main chat container component |
| `frontend/components/chat/MessageBubble.tsx` | NEW | Individual message with tool-call chips |
| `frontend/components/chat/ChatInput.tsx` | NEW | Text input with validation and char counter |
| `frontend/app/(dashboard)/chat/page.tsx` | NEW | Chat page route within dashboard |
| `frontend/components/layout/Sidebar.tsx` | MODIFIED | Add "Chat" nav item |
| `frontend/.env.example` | MODIFIED | Add chat-related comment to existing var |

**Files NOT changed** (verified):
- `backend/main.py` — CORS already configured, chat router already registered
- `backend/routes/chat.py` — endpoint unchanged
- `backend/models.py` — no modifications
- `frontend/lib/hooks/useTasks.ts` — no modifications
- `frontend/lib/hooks/useAuth.ts` — no modifications (consumed as-is)
- `frontend/components/dashboard/*` — all task components preserved

## Risks

1. **Text-based tool call detection may miss edge cases** — The assistant
   may phrase actions in unexpected ways, causing missed or incorrect
   tool-call indicators. Mitigated by testing with real assistant responses
   and keeping the parser simple (false negatives are better than false
   positives). Can be upgraded to structured metadata later.

2. **Chat endpoint has no JWT auth** — The `user_id` is in the URL path
   with no token verification. Any client that knows the URL can send
   messages as any user. This is a known limitation from Feature 004
   (out of scope for Feature 005). Should be addressed in a future
   security hardening feature.

3. **No streaming support** — The backend returns the full response in
   a single JSON payload. For long assistant responses, the user sees
   nothing until the full response arrives (up to 30 seconds timeout).
   Mitigated by showing a loading indicator. Streaming can be added as
   a future enhancement.

## Complexity Tracking

> No Constitution Check violations. No complexity justifications needed.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None      | —          | —                                   |
