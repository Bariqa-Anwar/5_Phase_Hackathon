---
id: 006
title: Fix MCP server handshake timeout
stage: green
date: 2026-02-08
surface: agent
model: claude-opus-4-6
feature: 005-frontend-chatkit-integration
branch: 005-frontend-chatkit-integration
user: shaheer
command: prompt
labels: ["mcp", "timeout", "bug-fix", "backend"]
links:
  spec: specs/005-frontend-chatkit-integration/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - backend/main.py
tests:
  - "Manual verification: main.py imports and app creation succeeds"
---

## Prompt

The backend application is failing to start because the MCP server handshake is timing out (5.0s limit). Please perform these fixes in 'backend/main.py': 1. Locate the 'lifespan' function where 'MCPServerStdio' is initialized. 2. Increase the connection timeout to 20 seconds. 3. If using the OpenAI Agents SDK 'MCPServerStdio', ensure the timeout is passed correctly (e.g., using 'StdioConnectionParams' or the 'timeout' argument in the constructor). 4. Add a 'try/except' block around the 'await mcp_server.connect()' call to provide a more descriptive error message if it fails again.

## Response snapshot

Investigated the OpenAI Agents SDK source and found that MCPServerStdio accepts `client_session_timeout_seconds` (default 5). Added `client_session_timeout_seconds=20` to the constructor in the lifespan function. Wrapped the `async with MCPServerStdio(...)` block in try/except that logs the MCP server script path and raises a descriptive RuntimeError. Verified the module loads cleanly.

## Outcome

- Impact: MCP server handshake timeout increased from 5s to 20s, preventing startup failures on slow connections or cold starts.
- Tests: Manual verification confirmed main.py imports and FastAPI app creation succeeds without errors.
- Files: 1 file modified (backend/main.py) -- added client_session_timeout_seconds=20 and try/except error handling.
- Next prompts: Test full server startup with MCP subprocess; verify chat endpoint works end-to-end.
- Reflection: The SDK default of 5s is too aggressive for subprocess MCP servers that need time to initialize. The `client_session_timeout_seconds` parameter is not obvious from the docs -- had to inspect SDK source to find it.

## Evaluation notes (flywheel)

- Failure modes observed: MCPServerStdio default 5s timeout too short for MCP subprocess startup on this environment.
- Graders run and results (PASS/FAIL): Module import test PASS -- app created successfully with lifespan configured.
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Monitor actual MCP handshake time in logs to determine if 20s is appropriate or if it can be tuned further.
