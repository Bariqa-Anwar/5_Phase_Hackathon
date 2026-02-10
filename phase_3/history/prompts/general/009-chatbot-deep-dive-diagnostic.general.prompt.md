---
id: 009
title: Chatbot Deep-Dive Diagnostic
stage: general
date: 2026-02-09
surface: agent
model: claude-opus-4-6
feature: none
branch: 005-frontend-chatkit-integration
user: Rana
command: (user prompt)
labels: ["debugging", "chatbot", "mcp", "diagnostics"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - backend/main.py (modified)
  - backend/routes/chat.py (modified)
  - backend/routes/diagnostics.py (created)
tests:
  - (none)
---

## Prompt

The frontend is authenticated (user 'Rana' is visible), but the Chatbot still says 'I'm having trouble connecting.' Please perform a deep-dive diagnostic:

1. **Verify MCP Health**: In 'backend/main.py', look at the 'lifespan' event. Add a log: 'print(f"MCP Server State: {mcp_server.is_connected()}")' to see if the tool-server actually initialized.
2. **Mock Chat Test**: Create a temporary route 'GET /api/test-chat' that tries to call a simple tool through the MCP server and returns the result. This will tell us if the problem is the LLM or the MCP connection.
3. **OpenRouter / OpenAI Key**: Double-check that the '.env' in the 'backend/' folder has a valid 'OPENROUTER_API_KEY' or 'OPENAI_API_KEY'. If the key is missing or invalid, the chatbot will fail silently.
4. **CORS Check**: Ensure 'main.py' allows requests from 'http://localhost:3000' with 'allow_credentials=True' and the correct headers.

## Response snapshot

Added MCP health logging at startup (list_tools verification), created GET /api/test-chat diagnostic endpoint testing MCP tools, MCP tool calls, and OpenRouter LLM independently, added API key presence/length logging and full stack trace on agent errors (exc_info=True). CORS confirmed correct. Most likely root cause: OpenRouter API key may be revoked or rate-limited.

## Outcome

- Impact: Diagnostic instrumentation complete; all 4 checks addressed
- Tests: No new tests added; diagnostic endpoint serves as manual verification tool
- Files: 3 files touched (backend/main.py, backend/routes/chat.py, backend/routes/diagnostics.py)
- Next prompts: Test the /api/test-chat endpoint to confirm MCP and LLM connectivity; rotate OpenRouter API key if diagnostics confirm key issue
- Reflection: Silent failures in API key validation and MCP initialization made debugging difficult; adding explicit health checks and structured error logging improves future debuggability

## Evaluation notes (flywheel)

- Failure modes observed: Chatbot returned generic error message without logging root cause; no health-check endpoint existed for MCP or LLM subsystems
- Graders run and results (PASS/FAIL): N/A (manual diagnostic session)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Hit GET /api/test-chat to isolate whether failure is MCP-side or LLM-side, then fix accordingly
