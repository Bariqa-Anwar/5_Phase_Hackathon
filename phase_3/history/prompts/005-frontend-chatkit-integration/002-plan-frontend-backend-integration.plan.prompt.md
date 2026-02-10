---
id: 002
title: Plan Frontend Backend Chat Integration
stage: plan
date: 2026-02-08
surface: agent
model: claude-opus-4-6
feature: 005-frontend-chatkit-integration
branch: 005-frontend-chatkit-integration
user: shaheer
command: /sp.plan
labels: ["frontend", "chatkit", "integration", "plan", "architecture"]
links:
  spec: specs/005-frontend-chatkit-integration/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/005-frontend-chatkit-integration/plan.md
  - specs/005-frontend-chatkit-integration/research.md
  - specs/005-frontend-chatkit-integration/data-model.md
  - specs/005-frontend-chatkit-integration/quickstart.md
  - specs/005-frontend-chatkit-integration/contracts/chat-api.md
tests:
  - none
---

## Prompt

Integrate the existing frontend with the verified backend chatbot API.

OBJECTIVES:
1. **Frontend API Configuration**:
    - Locate the OpenAI ChatKit initialization in the existing /frontend folder.
    - Update the `useChatKit` hook (or equivalent) to use the local FastAPI backend as the 'api' provider.
    - Specifically, implement `getClientSecret` to fetch from 'http://localhost:8000/api/{user_id}/chat'.
2. **CORS Enablement**:
    - Update 'backend/main.py' to include 'CORSMiddleware'.
    - Allow origins from 'http://localhost:3000' (your existing frontend).
3. **Session Handshake**:
    - In the frontend, ensure the 'user_id' is consistently pulled from the user session or a mock ID for now.
    - Ensure 'conversation_id' is sent with every POST request to the chat endpoint to maintain stateless history.
4. **Environment Variables**:
    - Update '/frontend/.env.local' with 'NEXT_PUBLIC_BACKEND_URL'.
    - Ensure 'NEXT_PUBLIC_OPENAI_DOMAIN_KEY' is set as required by ChatKit.
5. **Tool CallUI Handling**:
    - Configure the frontend to gracefully handle tool-call metadata in the response, ensuring the user sees when a task is 'Added' or 'Updated' via the agent.

CONSTRAINTS:
- Do not remove any existing task list UI components.
- Do not use 'git' commands.
- Ensure the 'user_id' remains the primary key for all stateless operations.

## Response snapshot

Created implementation plan with 7 phases covering: TypeScript types, API client extension, tool call parser, useChat hook, chat UI components (ChatWindow, MessageBubble, ChatInput), chat page routing, and environment documentation.

Critical finding: No OpenAI ChatKit exists in the codebase. Frontend uses custom fetch-based API client with React hooks. Plan builds on existing patterns instead of installing ChatKit.

Key architecture decisions:
- AD-1: Custom useChat() hook instead of ChatKit (protocol mismatch)
- AD-2: No JWT for chat endpoint (user_id in URL path)
- AD-3: Text-based tool call detection (no structured metadata in response)
- AD-4: Chat page in dashboard route group (/chat)
- AD-5: Conversation state in React hook (no localStorage)

CORS already configured. No backend changes needed. No new env vars needed. 5 new files, 2 modified files.

## Outcome

- ✅ Impact: Complete implementation plan with 7 phases, 5 architecture decisions, research, data model, API contract, and quickstart guide
- 🧪 Tests: No code tests — plan-phase artifact
- 📁 Files: 5 files created (plan.md, research.md, data-model.md, quickstart.md, contracts/chat-api.md)
- 🔁 Next prompts: `/sp.tasks` to generate task breakdown, then `/sp.implement` to execute
- 🧠 Reflection: User's objectives referenced non-existent ChatKit components. Plan correctly identified the gap and proposed a pragmatic alternative using existing patterns. CORS and env vars were already configured — no changes needed.

## Evaluation notes (flywheel)

- Failure modes observed: None — plan generated without blockers
- Graders run and results (PASS/FAIL): Constitution Check — PASS (all 7 principles)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
