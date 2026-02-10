---
id: 001
title: Initial Constitution Ratification
stage: constitution
date: 2026-02-08
surface: agent
model: claude-opus-4-6
feature: none
branch: master
user: shaheer
command: sp.constitution set
labels: ["constitution", "project-setup", "governance"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
tests:
  - N/A
---

## Prompt

sp constitution set "Phase 3: Todo AI Chatbot | UV & Agentic Stack" --rules "
1. **ENVIRONMENT (UV PRESET)**: Use existing `uv` project structure. Respect `.python-version`, `pyproject.toml`, and the existing `venv`. All new dependencies must be added via `uv add`. Never use `pip`.
2. **PROJECT ENTRY**: Use the existing `main.py` as the primary FastAPI entry point. Do not create secondary entry files unless modularizing logic into a `/src` or `/app` directory as per FastAPI best practices.
3. **NO VIBE CODING**: Strict adherence to Agentic Dev Stack: Spec (Markdown) -> Plan -> Tasks -> Execution. All logic must be derived from the Phase 3 Todo AI Chatbot document.
4. **GITHUB & GIT GUARDRAILS**: **STRICT FORBIDDEN**: Do not run `git` commands, do not touch `.git/`, and do not attempt to push/pull. All repository management is the user's manual responsibility.
5. **STATELESS ARCHITECTURE**:
    - Server must hold NO in-memory state.
    - Use Neon PostgreSQL (via SQLModel) for all persistence (Tasks, Conversations, Messages).
    - MCP Tools (add_task, list_tasks, etc.) must perform direct DB operations.
6. **AI & MCP STACK**:
    - Implement the 'Official MCP SDK' for tool definition.
    - Use 'OpenAI Agents SDK' for the orchestration layer.
    - ChatKit integration must follow the stateless request cycle (History Fetch -> Agent Run -> Save -> Respond).
7. **DEPLOYMENT FOCUS**: Write code that is production-ready for Vercel/Railway. Use Pydantic schemas for all request/response models and ensure environment variables (DATABASE_URL, OPENAI_API_KEY) are used for secrets."

## Response snapshot

Created constitution v1.0.0 for "Phase 3: Todo AI Chatbot | UV & Agentic Stack" at `.specify/memory/constitution.md`. Seven principles ratified: (I) UV Environment Discipline, (II) FastAPI Entry Convention, (III) Spec-Driven Development, (IV) Git Guardrails, (V) Stateless Architecture, (VI) AI & MCP Stack, (VII) Deployment Readiness. Includes Technology Stack table, Development Workflow section, and Governance with amendment procedure and semantic versioning policy. All templates verified — no updates needed (generic templates compatible). Sync Impact Report embedded as HTML comment.

## Outcome

- ✅ Impact: Constitution v1.0.0 ratified — all 7 user-supplied rules encoded as enforceable principles
- 🧪 Tests: N/A (governance document, no code changes)
- 📁 Files: .specify/memory/constitution.md (created)
- 🔁 Next prompts: Create feature spec via `/sp.specify`, run `/sp.plan` for architecture
- 🧠 Reflection: User provided highly specific rules — mapped 1:1 to declarative principles with MUST/FORBIDDEN language for enforceability

## Evaluation notes (flywheel)

- Failure modes observed: None — user input was comprehensive
- Graders run and results (PASS/FAIL): Manual validation PASS — no unresolved placeholders, all dates ISO, all principles testable
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Validate constitution gates during first `/sp.plan` run
