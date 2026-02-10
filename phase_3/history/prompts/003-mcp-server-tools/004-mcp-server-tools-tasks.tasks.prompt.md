---
id: 004
title: MCP Server Tools Task Generation
stage: tasks
date: 2026-02-08
surface: agent
model: claude-opus-4-6
feature: 003-mcp-server-tools
branch: master
user: shaheer
command: sp.tasks
labels: ["mcp", "tasks", "implementation-plan", "checklist"]
links:
  spec: specs/003-mcp-server-tools/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - specs/003-mcp-server-tools/tasks.md
tests:
  - N/A
---

## Prompt

sp task "Generate a checklist of atomic tasks to implement the MCP Tools within the existing folder structure.

RESOURCES:
- Config: Load OpenRouter API keys from /backend/.env.
- Tools: Use 'uv' for dependency management.
- Logic: Base implementation on /specs/mcp_tools_spec.md.

TASK LIST REQUIREMENTS:
1. **Env Setup**: Run 'uv add mcp sqlmodel' to ensure the environment is ready.
2. **Schema Extension**: Modify existing 'backend/models.py' to include SQLModel classes for Task, Conversation, and Message as per the document.
3. **MCP Initialization**: Create 'backend/mcp_server.py' and initialize the FastMCP or Official MCP Server instance.
4. **Tool: add_task**: Implement tool with logic to save to Neon DB via SQLModel.
5. **Tool: list_tasks**: Implement tool with status filtering (all/pending/completed) scoped by user_id.
6. **Tool: complete_task**: Implement logic to update 'completed' boolean in the DB.
7. **Tool: delete_task**: Implement row deletion for specific task_id and user_id.
8. **Tool: update_task**: Implement partial updates for title and description.
9. **Verification**: Create a small test script to verify the MCP server can connect to the DB using the /backend/.env credentials.

STRICT RULES:
- Do not use 'git'.
- Do not modify existing frontend code yet.
- Ensure all functions remain stateless."

## Response snapshot

Generated `specs/003-mcp-server-tools/tasks.md` with 19 atomic tasks across 7 phases:
- Phase 1 (Setup): T001-T002 — dependency installation via `uv add`
- Phase 2 (Foundational): T003-T006 — MessageRole enum, Conversation model, Message model, mcp_server.py shell
- Phase 3 (US1 MVP): T007-T011 — all 5 MCP tools (add, list, complete, delete, update)
- Phase 4 (US2): T012-T013 — error handling + user isolation audit
- Phase 5 (US3): T014-T016 — coexistence verification + test script
- Phase 6 (US4): T017 — .env.example with OpenRouter config
- Phase 7 (Polish): T018-T019 — MCP inspector + quickstart validation

MVP scope: T001-T011 (11 tasks). Total: 19 tasks. Every task has exact file paths, specific behavior, and references to contracts/data-model.

## Outcome

- ✅ Impact: Complete task checklist generated — immediately executable, each task has enough detail for autonomous implementation
- 🧪 Tests: T016 is a verification test script (user requested)
- 📁 Files: specs/003-mcp-server-tools/tasks.md
- 🔁 Next prompts: Run `/sp.implement` to execute tasks, or implement manually starting with T001
- 🧠 Reflection: Mapped all 4 user stories to phases. US1+US2 (both P1) have sequential dependency (tools before validation). US4 can parallel with US1-US3 (different file).

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): Format validation PASS — all 19 tasks have checkbox, ID, story label (where applicable), file paths
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Track task completion during /sp.implement
