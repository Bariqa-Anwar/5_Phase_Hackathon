---
id: 003
title: Generate Frontend Integration Tasks
stage: tasks
date: 2026-02-08
surface: agent
model: claude-opus-4-6
feature: 005-frontend-chatkit-integration
branch: 005-frontend-chatkit-integration
user: shaheer
command: /sp.tasks
labels: ["tasks", "frontend", "chatkit", "integration", "chat-ui"]
links:
  spec: specs/005-frontend-chatkit-integration/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/005-frontend-chatkit-integration/tasks.md
tests:
  - null
---

## Prompt

Generate a checklist of atomic tasks for integrating the existing frontend with the new Chatbot backend.

RESOURCES:
- Frontend: Existing OpenAI ChatKit implementation in /frontend.
- Backend: Verified FastAPI app with '/api/{user_id}/chat' and CORS needs.
- Config: NEXT_PUBLIC_BACKEND_URL in /frontend/.env.local.

TASK LIST REQUIREMENTS:
1. **CORS Implementation**: Add 'fastapi.middleware.cors.CORSMiddleware' to 'backend/main.py'. Allow origins 'http://localhost:3000'.
2. **Frontend Env Setup**: Update or create '/frontend/.env.local' with 'NEXT_PUBLIC_BACKEND_URL=http://localhost:8000'.
3. **ChatKit Hook Update**:
    - Locate 'useChatKit' in the frontend.
    - Update the 'api' configuration to point to your FastAPI chat endpoint.
    - Ensure 'user_id' is dynamically inserted into the URL path.
4. **Session Handling**: Update the frontend message-sending logic to capture the 'conversation_id' from the backend response and include it in subsequent requests.
5. **Tool Feedback UI**: (Optional/Bonus) Add a simple toast or badge notification in the chat UI when the backend response contains 'tool_calls'.
6. **End-to-End Test**: Verify that sending a message like 'Add a task to buy milk' in the UI successfully updates the Neon DB and returns a confirmation message.

STRICT RULES:
- Do not modify existing task list components.
- Do not use 'git' commands.
- Ensure the user_id from the frontend matches the expected path parameter in the backend.

## Response snapshot

Generated `specs/005-frontend-chatkit-integration/tasks.md` with 18 atomic tasks organized across 7 phases:
- **Phase 1 (Setup)**: 2 tasks — TypeScript types and env docs
- **Phase 2 (Foundational)**: 2 tasks — API client chat method and Sidebar navigation
- **Phase 3 (US1 MVP)**: 5 tasks — useChat hook, ChatInput, MessageBubble, ChatWindow, chat page
- **Phase 4 (US2)**: 2 tasks — conversation_id tracking and 404 handling
- **Phase 5 (US3)**: 3 tasks — parseToolCalls utility, hook integration, chip rendering
- **Phase 6 (US4)**: 1 task — environment documentation verification
- **Phase 7 (Polish)**: 3 tasks — E2E validation, CORS verification, error state testing

Key findings incorporated from research.md:
- No OpenAI ChatKit exists in codebase — built custom useChat hook following useTasks pattern
- CORS already configured in backend/main.py — no backend changes needed
- NEXT_PUBLIC_API_URL already exists — no new env vars needed
- Tool call detection via text parsing (no structured metadata in ChatResponse)

## Outcome

- ✅ Impact: 18 tasks generated covering 4 user stories from spec, organized by priority (P1-P4)
- 🧪 Tests: No test tasks generated (not requested in spec)
- 📁 Files: 1 file created (tasks.md)
- 🔁 Next prompts: `/sp.implement` to begin executing tasks, starting with MVP (Phases 1-3)
- 🧠 Reflection: User's initial requirements referenced ChatKit/CORS changes that research proved unnecessary. Tasks correctly reflect actual codebase state rather than assumed state.

## Evaluation notes (flywheel)

- Failure modes observed: None — all design artifacts were consistent and complete
- Graders run and results (PASS/FAIL): Format validation PASS — all 18 tasks follow checkbox + ID + labels + file path format
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
