---
id: 003
title: MCP Server Tools Implementation Plan
stage: plan
date: 2026-02-08
surface: agent
model: claude-opus-4-6
feature: 003-mcp-server-tools
branch: master
user: shaheer
command: sp.plan
labels: ["mcp", "plan", "architecture", "fastmcp", "openai-agents"]
links:
  spec: specs/003-mcp-server-tools/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/003-mcp-server-tools/plan.md
  - specs/003-mcp-server-tools/research.md
  - specs/003-mcp-server-tools/data-model.md
  - specs/003-mcp-server-tools/contracts/mcp-tools.md
  - specs/003-mcp-server-tools/quickstart.md
tests:
  - N/A
---

## Prompt

sp plan "Develop the MCP Server infrastructure using the existing backend folder as the root.

OBJECTIVES:
1. **Dependency Audit**: Use 'uv' to ensure 'mcp', 'sqlmodel', and 'psycopg2-binary' (or 'asyncpg') are present in the existing venv.
2. **Database Alignment**: Check existing 'models.py' in the backend. Add or update SQLModel classes for Tasks, Conversations, and Messages to match the new requirements.
3. **MCP Server Core**: Create a new file 'backend/mcp_server.py' using the Official MCP SDK.
4. **Tool Implementation**: Code the 5 stateless tools (add_task, list_tasks, complete_task, delete_task, update_task) ensuring they accept 'user_id' and perform CRUD via SQLModel/Neon.
5. **OpenRouter Prep**: Ensure tool outputs are clean JSON, ready for the OpenRouter-powered agent to consume in the next step.

CONSTRAINTS:
- No changes to existing functional code in the backend/frontend folders.
- No 'git' or repository operations.
- All logic must be strictly derived from the /specs folder."

## Response snapshot

Generated 5 plan artifacts for feature 003-mcp-server-tools:

1. **plan.md** — Implementation plan with 5 phases, constitution check (all 7 principles PASS), architecture decisions (AD-1 through AD-5), project structure, and files-changed matrix.
2. **research.md** — 8 research decisions: FastMCP server pattern, stdio transport, Annotated type hints for validation, dict return types, direct Session(engine) for DB, OPENAI_BASE_URL env vars for OpenRouter, Conversation/Message forward schema, and dependency audit.
3. **data-model.md** — Existing Task model (unchanged), new Conversation and Message models with MessageRole enum, MCP tool input/output schemas with field constraints.
4. **contracts/mcp-tools.md** — Full JSON Schema contracts for all 5 tools with input schemas, output formats, behavior rules, error cases, and user isolation invariant.
5. **quickstart.md** — Step-by-step setup: uv add, env vars, run server, test tool call, verify coexistence, run existing tests.

Key decisions: FastMCP (official) + stdio transport + sync tools + Session(engine) directly + additive-only models.py changes + SQLModel.metadata.create_all for table creation.

## Outcome

- ✅ Impact: Complete implementation plan with all design artifacts ready for /sp.tasks
- 🧪 Tests: N/A (planning phase)
- 📁 Files: plan.md, research.md, data-model.md, contracts/mcp-tools.md, quickstart.md
- 🔁 Next prompts: Run `/sp.tasks` to generate implementation tasks
- 🧠 Reflection: Researched MCP SDK and OpenAI Agents SDK thoroughly before planning. Key insight: MCP server runs as stdio subprocess (not HTTP), so it's a separate process from FastAPI — no changes to main.py needed.

## Evaluation notes (flywheel)

- Failure modes observed: Setup script created files at specs/master/ instead of specs/003-mcp-server-tools/ — cleaned up manually
- Graders run and results (PASS/FAIL): Constitution check PASS (7/7 principles)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Verify FastMCP import path works with latest mcp package version
