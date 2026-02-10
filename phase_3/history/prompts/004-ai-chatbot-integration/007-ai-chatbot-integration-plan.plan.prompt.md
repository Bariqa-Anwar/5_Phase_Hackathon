---
id: 007
title: AI Chatbot Integration Plan
stage: plan
date: 2026-02-08
surface: agent
model: claude-opus-4-6
feature: 004-ai-chatbot-integration
branch: master
user: shaheer
command: sp.plan
labels: ["chatbot", "openai-agents", "openrouter", "mcp", "architecture"]
links:
  spec: specs/004-ai-chatbot-integration/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/004-ai-chatbot-integration/plan.md
  - specs/004-ai-chatbot-integration/research.md
  - specs/004-ai-chatbot-integration/data-model.md
  - specs/004-ai-chatbot-integration/contracts/chat-api.md
  - specs/004-ai-chatbot-integration/quickstart.md
tests:
  - N/A
---

## Prompt

sp plan "Implement the AI Chatbot logic and Chat API endpoint in the existing /backend folder.

OBJECTIVES:
1. **OpenRouter Configuration**: Set up the OpenAI Agents SDK to route through OpenRouter using the base_url 'https://openrouter.ai/api/v1' and the key from /backend/.env.
2. **Stateless History Retrieval**: Logic to fetch the last N messages from the 'messages' table for a given 'conversation_id' and 'user_id' before each agent run.
3. **Agent Orchestration**: Initialize the Agent with the system prompt and bind it to the tools in 'mcp_server.py'.
4. **Endpoint Creation**: Add the 'POST /api/{user_id}/chat' route to your FastAPI app (likely in main.py or a new router).
5. **Persistence Logic**: Ensure every cycle saves the incoming user message and the agent's final response to the Neon DB via SQLModel.
6. **Stateless Response**: Ensure the API returns the 'conversation_id' and 'response' string as per the Phase 3 requirements.

CONSTRAINTS:
- Do not disturb existing task-related endpoints.
- Ensure the 'user_id' from the URL path is passed to all MCP tools.
- Strict forbidden: No git commands."

## Response snapshot

Generated complete implementation plan for Feature 004 (AI Chatbot Integration). Created 5 plan artifacts: plan.md (6 architecture decisions, 6 implementation phases), research.md (9 research decisions covering SDK patterns, OpenRouter config, MCP lifecycle, history management, error handling), data-model.md (entity schemas + chat request cycle), contracts/chat-api.md (full REST API contract with examples), quickstart.md (7-step verification guide). Key architecture decisions: MCP server as application-lifetime subprocess via FastAPI lifespan, OpenRouter via explicit client configuration (not env var auto-detection), manual history input from Neon DB (no SDK SQLiteSession), persistence-first pattern (save user message before agent run), async endpoint with asyncio.wait_for timeout.

## Outcome

- Impact: Feature 004 plan complete — full chatbot architecture with OpenRouter + MCP integration
- Tests: N/A (planning phase)
- Files: plan.md, research.md, data-model.md, contracts/chat-api.md, quickstart.md
- Next prompts: Run `/sp.tasks` to generate implementation task list, or `/sp.clarify` for refinement
- Reflection: Critical finding from research — OpenAI Agents SDK does NOT auto-detect OPENAI_BASE_URL; requires explicit set_default_openai_client() call. Also requires set_default_openai_api("chat_completions") for non-OpenAI providers. These are non-obvious configuration steps that would have caused debugging time if not researched upfront.

## Evaluation notes (flywheel)

- Failure modes observed: Agent context update script fails (derives path from git branch "master" instead of feature name) — non-blocking, artifacts placed correctly manually
- Graders run and results (PASS/FAIL): Constitution Check PASS (all 7 principles)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Validate MCP subprocess lifespan pattern works with FastAPI's async context manager during /sp.tasks
