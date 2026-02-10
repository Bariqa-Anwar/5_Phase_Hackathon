# Tasks: Frontend ChatKit Backend Integration

**Input**: Design documents from `/specs/005-frontend-chatkit-integration/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/chat-api.md, quickstart.md

**Tests**: Not requested in the feature specification. No test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `frontend/` for Next.js, `backend/` for FastAPI
- Paths are relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: TypeScript types, API client extension, and environment documentation — shared by all user stories

- [x] T001 [P] Create chat TypeScript types (ChatMessage, ChatResponse, ChatRequest, ToolCallAction, CHAT_CONSTRAINTS) in `frontend/types/chat.ts`
- [x] T002 [P] Update `.env.example` to add comment clarifying chat uses the same `NEXT_PUBLIC_API_URL` variable in `frontend/.env.example`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: API client method and navigation — MUST be complete before any chat UI can function

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Add `chat.sendMessage(userId, message, conversationId?)` method to `frontend/lib/api-client.ts` — uses `POST ${API_BASE_URL}/api/${userId}/chat`, no JWT auth header, follows existing error handling pattern
- [x] T004 Add "Chat" navigation item to Sidebar with `MessageCircle` icon from `lucide-react` in `frontend/components/layout/Sidebar.tsx` — link to `/chat`

**Checkpoint**: Foundation ready — chat API client and navigation in place, user story implementation can begin

---

## Phase 3: User Story 1 — Send a Chat Message and Receive a Response (Priority: P1) MVP

**Goal**: A user can type a message in the chat UI, have it sent to the backend, and see the assistant's response in the conversation thread within 10 seconds.

**Independent Test**: Open `/chat`, type "Hello", press send. Confirm the message appears in the thread and the assistant's reply renders below it. Verify loading state shows while waiting and input is disabled during the request.

**Acceptance Criteria (from spec)**:
1. User types a message and presses send → message appears in thread, assistant reply displays within 10 seconds
2. Empty message → send action blocked, validation hint shown
3. Backend unreachable → error message displayed with retry option

### Implementation for User Story 1

- [x] T005 [P] [US1] Create `useChat` hook in `frontend/lib/hooks/useChat.ts` — state: `messages` (ChatMessage[]), `conversationId` (number|null), `isLoading` (boolean), `error` (string|null); methods: `sendMessage(text)` (validate non-empty and max length, add optimistic user message, call `api.chat.sendMessage`, add assistant message on success, set error on failure), `resetChat()` (clear messages and conversationId); uses `api.chat.sendMessage` from api-client; follows `useTasks` pattern
- [x] T006 [P] [US1] Create `ChatInput` component in `frontend/components/chat/ChatInput.tsx` — textarea with send button, character counter (`{current}/10000` shown near limit), disable send when empty/exceeding limit/loading, Enter to send (Shift+Enter for newline), accepts `onSend(text)`, `isLoading`, `disabled` props
- [x] T007 [P] [US1] Create `MessageBubble` component in `frontend/components/chat/MessageBubble.tsx` — user messages right-aligned with blue background, assistant messages left-aligned with gray background, loading state with animated dots for in-flight response, error state with red tint, accepts `ChatMessage` prop
- [x] T008 [US1] Create `ChatWindow` component in `frontend/components/chat/ChatWindow.tsx` — flex column container, header with "Chat" title + "New Chat" button, scrollable message list (auto-scroll to bottom on new messages), ChatInput footer, error banner (dismissable), empty state with welcome message and usage suggestions; composes MessageBubble and ChatInput; accepts `useChat` return values as props
- [x] T009 [US1] Create chat page at `frontend/app/(dashboard)/chat/page.tsx` — uses `useAuth()` to get `user.id`, passes `userId` to `useChat()` hook, renders `ChatWindow`, shows loading spinner while auth is pending, redirects to login if not authenticated; follows `DashboardPage` pattern

**Checkpoint**: User Story 1 is fully functional — users can send messages and receive AI responses in the chat UI

---

## Phase 4: User Story 2 — Maintain Conversation Context Across Messages (Priority: P2)

**Goal**: Users can send multiple related messages and the assistant maintains awareness of the full conversation history via a tracked `conversation_id`.

**Independent Test**: Send "Add a task called Buy groceries", then follow up with "Mark it as completed". Confirm the assistant's second reply references the first task without the user re-specifying it.

**Acceptance Criteria (from spec)**:
1. Follow-up message → backend receives stored `conversation_id`, reply reflects prior context
2. Chat stays in same conversation within the session (no page refresh)
3. First message → new `conversation_id` created, stored locally, sent with subsequent messages

### Implementation for User Story 2

- [x] T010 [US2] Update `useChat` hook to capture `conversation_id` from `ChatResponse` and include it in subsequent `sendMessage` calls in `frontend/lib/hooks/useChat.ts` — on first response, store `conversation_id` from backend; on subsequent calls, pass stored `conversationId` to `api.chat.sendMessage`; `resetChat()` sets `conversationId` back to `null`
- [x] T011 [US2] Handle 404 conversation error gracefully in `useChat` hook in `frontend/lib/hooks/useChat.ts` — if backend returns 404 (conversation not found), reset `conversationId` to `null`, show user-friendly message "Conversation not found. Starting a new chat.", and allow the user to resend

**Checkpoint**: User Story 2 is functional — multi-turn conversations maintain context through `conversation_id`

---

## Phase 5: User Story 3 — See Tool Call Feedback in the Chat (Priority: P3)

**Goal**: When the assistant performs a tool action (create/list/complete/delete/update task), a visual indicator (chip/badge) appears alongside the text response.

**Independent Test**: Send "Create a task called Test". Confirm the assistant's response includes a colored badge showing "Task Created" alongside the text reply. Send a conversational message (e.g., "Hello") and confirm no tool badge appears.

**Acceptance Criteria (from spec)**:
1. Message triggers tool call → visual indicator shows the action (e.g., "Task Created")
2. Multiple tool calls → each action indicated individually
3. No tool call → no indicator shown

### Implementation for User Story 3

- [x] T012 [P] [US3] Create `parseToolCalls(text: string): ToolCallAction[]` utility in `frontend/lib/chat-utils.ts` — pattern matching: "created"/"added" + "task" → `task_created`/"Task Created"; "here are"/"your tasks"/"tasks:" → `tasks_listed`/"Tasks Listed"; "completed"/"marked" + "complete" → `task_completed`/"Task Completed"; "deleted"/"removed" → `task_deleted`/"Task Deleted"; "updated"/"changed" → `task_updated`/"Task Updated"; returns empty array when no patterns match
- [x] T013 [US3] Integrate `parseToolCalls` into `useChat` hook in `frontend/lib/hooks/useChat.ts` — after receiving assistant response, run `parseToolCalls(response)` and attach result to the assistant `ChatMessage.toolCalls` array
- [x] T014 [US3] Add tool-call chip rendering to `MessageBubble` component in `frontend/components/chat/MessageBubble.tsx` — for assistant messages with non-empty `toolCalls`, render colored badge/chip elements below the message text (e.g., green for created, blue for listed, yellow for completed, red for deleted, purple for updated)

**Checkpoint**: User Story 3 is functional — tool actions show visual feedback in the chat UI

---

## Phase 6: User Story 4 — Environment Configuration for Local Development (Priority: P4)

**Goal**: A developer cloning the project can configure frontend-to-backend connection by following documented environment variables.

**Independent Test**: Copy `.env.example` to `.env.local`, fill in values, start frontend and backend, verify chat messages route to the configured backend.

**Acceptance Criteria (from spec)**:
1. Developer sets `NEXT_PUBLIC_API_URL` and starts frontend → chat messages route to configured backend
2. Developer omits `NEXT_PUBLIC_API_URL` → system falls back to `localhost:8000`

### Implementation for User Story 4

- [x] T015 [US4] Verify and update `frontend/.env.example` with clear documentation comments for all chat-relevant variables — ensure `NEXT_PUBLIC_API_URL` is documented with its purpose ("Backend API — used for both task CRUD and AI chat"), default value, and fallback behavior; confirm no `NEXT_PUBLIC_OPENAI_DOMAIN_KEY` or `NEXT_PUBLIC_BACKEND_URL` references exist (they are not needed per research.md R-1 and R-4)

**Checkpoint**: User Story 4 is complete — developer environment setup is documented and functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end validation and final integration checks

- [x] T016 Validate end-to-end flow per `quickstart.md` verification checklist — start backend (`uv run uvicorn main:app --reload`), start frontend (`npm run dev`), log in, navigate to `/chat`, send "Add a task called Buy milk", confirm assistant response with tool-call badge, send follow-up "List my tasks", confirm context maintained
- [x] T017 Verify CORS works for chat requests — confirm no CORS errors in browser console when sending chat messages from `http://localhost:3000` to `http://localhost:8000`; CORS is already configured in `backend/main.py:129-138` (no changes needed)
- [x] T018 Verify error states render correctly — test with backend stopped (should show friendly error), test with empty message (should block send), test with message exceeding 10,000 chars (should show counter and block send)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on T001 (types needed for API client) — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion (T003 API client, T004 navigation)
- **User Story 2 (Phase 4)**: Depends on Phase 3 completion (extends `useChat` from US1)
- **User Story 3 (Phase 5)**: Depends on Phase 3 completion (extends `useChat` and `MessageBubble` from US1)
- **User Story 4 (Phase 6)**: Can start after Phase 1 (T002); independent of other stories
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — no dependencies on other stories
- **User Story 2 (P2)**: Depends on User Story 1 (extends `useChat` hook with `conversationId` tracking)
- **User Story 3 (P3)**: Depends on User Story 1 (extends `useChat` hook and `MessageBubble` component)
- **User Story 4 (P4)**: Independent — can start after Phase 1

### Within Each User Story

- Components marked [P] can be built in parallel (different files)
- Components that compose other components must wait (e.g., ChatWindow depends on ChatInput and MessageBubble)
- Hook extensions (US2, US3) must follow hook creation (US1)

### Parallel Opportunities

- **Phase 1**: T001 and T002 can run in parallel (different files)
- **Phase 3 (US1)**: T005, T006, T007 can run in parallel (different files); T008 depends on T006, T007; T009 depends on T005, T008
- **Phase 5 (US3)**: T012 can run in parallel with other work; T013, T014 depend on T012
- **US3 and US4**: Can run in parallel (US4 is independent)

---

## Parallel Example: User Story 1

```text
# Launch these three tasks in parallel (different files, no dependencies):
Task T005: "Create useChat hook in frontend/lib/hooks/useChat.ts"
Task T006: "Create ChatInput component in frontend/components/chat/ChatInput.tsx"
Task T007: "Create MessageBubble component in frontend/components/chat/MessageBubble.tsx"

# Then sequentially (depends on T006 + T007):
Task T008: "Create ChatWindow component in frontend/components/chat/ChatWindow.tsx"

# Then (depends on T005 + T008):
Task T009: "Create chat page at frontend/app/(dashboard)/chat/page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001, T002) — types and env docs
2. Complete Phase 2: Foundational (T003, T004) — API client and navigation
3. Complete Phase 3: User Story 1 (T005–T009) — full send/receive chat
4. **STOP and VALIDATE**: Test User Story 1 independently via quickstart.md checklist
5. Deploy/demo if ready — users can chat with the AI assistant

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy (MVP!)
3. Add User Story 2 → Test conversation continuity → Deploy
4. Add User Story 3 → Test tool-call feedback → Deploy
5. Add User Story 4 → Verify environment docs → Deploy
6. Polish → End-to-end validation → Final release

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- **No backend changes needed** — CORS, chat endpoint, and environment are already configured (verified in research.md R-3, R-4)
- **No new dependencies needed** — all UI built with existing React, Tailwind, lucide-react
- **No ChatKit** — the frontend uses a custom fetch-based API client, not OpenAI ChatKit (research.md R-1)
- `user_id` comes from `useAuth()` → `user.id` which matches the backend's `{user_id}` path parameter
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently

## Summary

| Metric | Value |
|--------|-------|
| **Total tasks** | 18 |
| **Phase 1 (Setup)** | 2 tasks |
| **Phase 2 (Foundational)** | 2 tasks |
| **US1 (Send/Receive)** | 5 tasks |
| **US2 (Conversation Context)** | 2 tasks |
| **US3 (Tool Feedback)** | 3 tasks |
| **US4 (Environment Config)** | 1 task |
| **Polish** | 3 tasks |
| **Parallel opportunities** | 6 task groups |
| **New files** | 7 (`types/chat.ts`, `hooks/useChat.ts`, `chat-utils.ts`, `ChatInput.tsx`, `MessageBubble.tsx`, `ChatWindow.tsx`, `chat/page.tsx`) |
| **Modified files** | 2 (`api-client.ts`, `Sidebar.tsx`) |
| **MVP scope** | Phases 1–3 (9 tasks) |
