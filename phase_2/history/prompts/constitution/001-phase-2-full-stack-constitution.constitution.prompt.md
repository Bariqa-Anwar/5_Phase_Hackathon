---
id: 001
title: Phase 2 Full-Stack Constitution
stage: constitution
date: 2026-02-05
surface: agent
model: claude-sonnet-4-5
feature: none
branch: master
user: system
command: /sp.constitution
labels: ["constitution", "phase-2", "monorepo", "full-stack", "uv", "fastapi", "nextjs"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - .specify/memory/constitution.md
tests:
 - None
---

## Prompt

# Todo Full-Stack Constitution (Phase II)

You are an Agentic Software Engineer. You operate strictly within the **Spec-Kit Plus** framework and the **UV-managed** Python ecosystem. Your primary goal is to transform the existing console app into a multi-user web application as defined in the Phase II documentation.

## 1. Environment & Tooling Context
- **Python Manager:** UV is already initialized. Always use `uv run` for execution and `uv add` for dependencies.
- **Virtual Environment:** The environment is pre-activated. Do not attempt to create a `.venv` manually.
- **Monorepo Awareness:** You are in a monorepo. The root contains `.spec-kit/`, `specs/`, `frontend/`, and `backend/`.
- **Existing Files:** Respect and update the existing `pyproject.toml` and `main.py` created during UV initialization.

## 2. The Spec-Kit Plus Directive
- **Spec-Driven Implementation:** Before any code change, you MUST read the corresponding specification in `/specs/`.
- **Reflective Updates:** If an implementation detail deviates from the spec, you must update the `.md` file in `/specs/` first.
- **Context Hierarchy:**
    - Reference `/CLAUDE.md` for global project rules.
    - Reference `/backend/CLAUDE.md` for FastAPI/SQLModel patterns.
    - Reference `/frontend/CLAUDE.md` for Next.js 16/Better Auth patterns.

## 3. Technology Stack & Architecture
- **Backend:** FastAPI, SQLModel (ORM), Neon Serverless PostgreSQL.
- **Frontend:** Next.js 16 (App Router), Tailwind CSS, TypeScript.
- **Auth:** Better Auth (Frontend) + JWT Verification Middleware (Backend).
- **Communication:** RESTful API with mandatory JWT `Authorization: Bearer <token>` headers.
- **Security:** Use the `BETTER_AUTH_SECRET` environment variable for shared JWT signing. Every database query MUST filter by `user_id`.

## 4. Operational Workflow
1. **Analyze:** Read `@specs/overview.md` and the specific feature spec (e.g., `@specs/features/authentication.md`).
2. **Plan:** Generate a step-by-step implementation plan.
3. **Execute:** - Use `uv` for backend tasks.
  - Use `npm/bun` for frontend tasks.
    - Edit files according to the established directory structure.
4. **Verify:** Ensure all 5 basic features (CRUD + Auth) are functional and responsive.

## 5. Restrictions
- **No Manual Coding:** All changes must be performed via your agentic tools.
- **Stateless Auth:** Do not use session cookies for the backend; strictly use JWT for API isolation.
- **Strict Typing:** Python code must use Pydantic/SQLModel types; Frontend must use TypeScript.

---
*Constitution active. Awaiting Spec-Kit command to begin Phase II implementation.*

## Response snapshot

Successfully created the Todo Full-Stack Constitution (Phase II) v1.0.0 at `.specify/memory/constitution.md`.

**Key Principles Established:**
1. **Environment & Tooling Context** - UV-managed Python, monorepo structure
2. **Spec-Kit Plus Directive** - Spec-driven implementation, reflective updates, context hierarchy
3. **Technology Stack & Architecture** - FastAPI/SQLModel backend, Next.js 16/TypeScript frontend, Better Auth + JWT
4. **Security & Multi-Tenancy** - Stateless authentication, user-level query filtering, environment variables
5. **Operational Workflow** - Analysis → Planning → Execution → Verification phases
6. **Strict Typing** - Pydantic/SQLModel for Python, TypeScript for frontend
7. **Agentic Execution** - Tool-based changes, smallest viable diffs, code references

**Additional Sections:**
- Development Constraints (existing files, directory structure, error handling)
- Testing Requirements (contract, integration, unit tests; TDD cycle)
- Governance (authority, amendments, compliance review, versioning policy)

**Template Validation:**
✅ plan-template.md - Constitution Check section aligned
✅ spec-template.md - Requirements sections validated
✅ tasks-template.md - Task categorization matches principles

## Outcome

- ✅ Impact: Initial constitution created, establishing governance and principles for Phase II full-stack development
- 🧪 Tests: None (constitution document)
- 📁 Files: Created `.specify/memory/constitution.md` (169 lines)
- 🔁 Next prompts: `/sp.specify` to create feature specifications, `/sp.plan` to generate implementation plans
- 🧠 Reflection: Constitution provides clear guardrails for UV-managed Python, monorepo structure, and full-stack patterns with Better Auth + JWT architecture

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): PASS - All placeholders resolved, version set to 1.0.0, dates in ISO format, principles are declarative and testable
- Prompt variant (if applicable): N/A - Initial constitution creation
- Next experiment (smallest change to try): Monitor constitution compliance during first feature implementation to identify any missing principles or constraints
