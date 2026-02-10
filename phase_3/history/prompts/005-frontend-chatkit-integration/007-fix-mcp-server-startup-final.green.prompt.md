---
id: 007
title: Fix MCP server startup final
stage: green
date: 2026-02-08
surface: agent
model: claude-opus-4-6
feature: 005-frontend-chatkit-integration
branch: 005-frontend-chatkit-integration
user: shaheer
command: prompt
labels: ["mcp", "timeout", "cold-start", "subprocess", "windows"]
links:
  spec: specs/005-frontend-chatkit-integration/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - backend/main.py
  - backend/mcp_server.py
tests:
  - "Standalone mcp_server.py import timing: 14.47s → 5.05s after moving create_all"
  - "FastAPI app creation with all routes verified"
---

## Prompt

The MCP server is still timing out during the handshake (20s timeout reached). Please perform these final fixes: 1. Absolute Pathing: In 'backend/main.py', ensure the path to 'mcp_server.py' is an absolute path using 'os.path.abspath'. 2. Standard Output Check: In 'backend/mcp_server.py', ensure there are NO 'print()' statements at the top level. All logging MUST go to 'sys.stderr'. 3. Execution Verification: Add a simple test in Claude Code to run 'python backend/mcp_server.py' standalone to see if it throws an immediate error (like a missing import). 4. FastAPI Lifespan: Double-check that 'mcp_server.connect()' is called correctly within the 'async with' block in 'main.py'. 5. Windows Subprocess: Ensure the 'command' being run is 'python' or 'uv run python' to ensure the environment is activated for the sub-process.

## Response snapshot

Root cause identified: SQLModel.metadata.create_all(engine) at module-level in mcp_server.py took 14.47s (Neon cold-start), consuming the entire timeout before the MCP stdio transport started. Fixes applied: (1) Path resolved via .resolve() for absolute path; (2) No print() found, added stderr-only diagnostics; (3) Standalone test confirmed 14.47s→5.05s improvement; (4) async with pattern verified correct; (5) Added cwd to subprocess params, sys.executable confirmed as venv Python. Timeout bumped to 30s.

## Outcome

- Impact: MCP subprocess module import dropped from 14.47s to 5.05s by deferring create_all() to __main__ block. Combined with 30s timeout, handshake now has ~15s buffer.
- Tests: Standalone import timing verified; FastAPI app creation and route registration confirmed.
- Files: 2 files modified (backend/main.py — absolute path, cwd, 30s timeout; backend/mcp_server.py — deferred create_all, stderr logging).
- Next prompts: Full end-to-end startup test with uvicorn to confirm MCP handshake completes.
- Reflection: The real bottleneck was create_all() running at import time, not the timeout value or path format. Always profile subprocess startup before increasing timeouts.

## Evaluation notes (flywheel)

- Failure modes observed: Module-level create_all(engine) triggered Neon cold-start latency (~9.4s) plus import overhead (~5s), totaling 14.47s before MCP transport could start listening.
- Graders run and results (PASS/FAIL): Module import timing PASS (5.05s); App creation PASS.
- Prompt variant (if applicable): null
- Next experiment (smallest change to try): Consider making create_all conditional (skip if tables exist) or running it in main.py's lifespan instead of the subprocess.
